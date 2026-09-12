import { useState, useEffect, useRef } from "react";
import { pushSupported, isIOS, isStandalone, getSubscription, subscribe, unsubscribe } from "./push";

export const ISSUE_SECTIONS = [
  { id: "Kitchen", en: "Kitchen", de: "Küche", emoji: "🍳" },
  { id: "Upper WC", en: "Upper WC", de: "Bad oben", emoji: "🛁" },
  { id: "Lower WC", en: "Lower WC", de: "Bad unten", emoji: "🚿" },
  { id: "Hall/Dining", en: "Hall/Dining", de: "Flur/Esszimmer", emoji: "🛋" },
  { id: "Common", en: "Common areas", de: "Gemeinschaft", emoji: "🪜" },
  { id: "Other", en: "Other", de: "Sonstiges", emoji: "🔧" },
];

const TXT = {
  en: {
    title: "Issues", reportTitle: "Report an issue", section: "Where is it?", describe: "What's wrong?",
    placeholder: "e.g. Kitchen tap is dripping, dishwasher not draining…", addPhoto: "Add photo", changePhoto: "Change photo", removePhoto: "Remove",
    submit: "Report issue", submitting: "Sending…", open: "Open", resolved: "Resolved", markResolved: "Mark resolved", reopen: "Reopen",
    delete: "Delete", confirmDelete: "Delete this issue?", empty: "No issues reported yet. 🎉", loading: "Loading issues…", loadError: "Couldn't load issues. Pull to retry.",
    retry: "Retry", by: "by", photoTooBig: "Photo could not be processed.", sendError: "Couldn't send — check your connection and try again.",
    notifTitle: "Notifications", notifOn: "You'll be notified on this device when an issue is reported.", notifOff: "Get a notification on this device when someone reports an issue.",
    notifEnable: "Turn on", notifDisable: "Turn off", notifDenied: "Notifications are blocked for this site — enable them in your browser/phone settings.",
    notifIOS: "On iPhone: add this app to your Home Screen first (Share → Add to Home Screen), then open it from there to turn on notifications.",
    notifUnsupported: "This browser doesn't support notifications.",
  },
  de: {
    title: "Probleme", reportTitle: "Problem melden", section: "Wo ist es?", describe: "Was ist los?",
    placeholder: "z. B. Wasserhahn tropft, Spülmaschine läuft nicht ab…", addPhoto: "Foto hinzufügen", changePhoto: "Foto ändern", removePhoto: "Entfernen",
    submit: "Problem melden", submitting: "Senden…", open: "Offen", resolved: "Erledigt", markResolved: "Als erledigt markieren", reopen: "Wieder öffnen",
    delete: "Löschen", confirmDelete: "Dieses Problem löschen?", empty: "Noch keine Probleme gemeldet. 🎉", loading: "Lade Probleme…", loadError: "Probleme konnten nicht geladen werden.",
    retry: "Erneut versuchen", by: "von", photoTooBig: "Foto konnte nicht verarbeitet werden.", sendError: "Senden fehlgeschlagen — bitte Verbindung prüfen.",
    notifTitle: "Benachrichtigungen", notifOn: "Du wirst auf diesem Gerät benachrichtigt, wenn ein Problem gemeldet wird.", notifOff: "Erhalte auf diesem Gerät eine Benachrichtigung, wenn jemand ein Problem meldet.",
    notifEnable: "Einschalten", notifDisable: "Ausschalten", notifDenied: "Benachrichtigungen sind für diese Seite blockiert — bitte in den Browser-/Handy-Einstellungen erlauben.",
    notifIOS: "Auf dem iPhone: App zuerst zum Home-Bildschirm hinzufügen (Teilen → Zum Home-Bildschirm), dann von dort öffnen und Benachrichtigungen einschalten.",
    notifUnsupported: "Dieser Browser unterstützt keine Benachrichtigungen.",
  },
};

type Issue = {
  id: number; section: string; description: string; reported_by: string;
  status: "open" | "resolved"; created_at: string; resolved_at: string | null; has_photo: boolean;
};

// Shrink the photo client-side so the upload (and the DB row) stays small.
async function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<{ base64: string; type: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", quality);
  return { base64: preview.split(",")[1], type: "image/jpeg", preview };
}

function formatWhen(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" }) + ", " +
    d.toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function Issues({ user, lang, cardStyle, onLoaded }: { user: string; lang: string; cardStyle: any; onLoaded?: (issues: Issue[]) => void }) {
  const t = TXT[lang === "de" ? "de" : "en"];
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<{ base64: string; type: string; preview: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pushState, setPushState] = useState<"unsupported" | "ios-browser" | "off" | "on" | "denied" | "busy">("busy");

  useEffect(() => {
    if (!pushSupported()) { setPushState(isIOS() && !isStandalone() ? "ios-browser" : "unsupported"); return; }
    if (Notification.permission === "denied") { setPushState("denied"); return; }
    getSubscription().then((sub) => setPushState(sub ? "on" : "off")).catch(() => setPushState("off"));
  }, []);

  async function togglePush() {
    const prev = pushState;
    setPushState("busy");
    try {
      if (prev === "on") { await unsubscribe(); setPushState("off"); }
      else { await subscribe(user); setPushState("on"); }
    } catch (e: any) {
      setPushState(e?.message === "denied" || Notification.permission === "denied" ? "denied" : prev);
    }
  }

  async function load() {
    setLoadFailed(false);
    try {
      const r = await fetch("/api/issues");
      if (!r.ok) throw new Error();
      const list: Issue[] = await r.json();
      setIssues(list);
      onLoaded?.(list);
    } catch { setLoadFailed(true); }
  }
  useEffect(() => { load(); }, []);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setPhoto(await compressImage(f)); setError(null); }
    catch { setError(t.photoTooBig); }
    e.target.value = "";
  }

  async function submit() {
    if (!section || !description.trim() || sending) return;
    setSending(true); setError(null);
    try {
      const r = await fetch("/api/issues", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, description: description.trim(), reportedBy: user, photo: photo?.base64, photoType: photo?.type }),
      });
      if (!r.ok) throw new Error();
      const created: Issue = await r.json();
      setIssues((prev) => [created, ...(prev ?? [])]);
      onLoaded?.([created]);
      setSection(null); setDescription(""); setPhoto(null);
    } catch { setError(t.sendError); }
    finally { setSending(false); }
  }

  async function setStatus(issue: Issue, status: "open" | "resolved") {
    setBusyId(issue.id);
    try {
      const r = await fetch(`/api/issues/${issue.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, by: user }) });
      if (!r.ok) throw new Error();
      const updated: Issue = await r.json();
      setIssues((prev) => (prev ?? []).map((i) => (i.id === updated.id ? updated : i)));
    } catch { setError(t.sendError); }
    finally { setBusyId(null); }
  }

  async function remove(issue: Issue) {
    if (!window.confirm(t.confirmDelete)) return;
    setBusyId(issue.id);
    try {
      const r = await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setIssues((prev) => (prev ?? []).filter((i) => i.id !== issue.id));
    } catch { setError(t.sendError); }
    finally { setBusyId(null); }
  }

  const sectionLabel = (id: string) => { const s = ISSUE_SECTIONS.find((x) => x.id === id); return s ? `${s.emoji} ${lang === "de" ? s.de : s.en}` : id; };
  const open = (issues ?? []).filter((i) => i.status === "open");
  const done = (issues ?? []).filter((i) => i.status === "resolved");
  const canSubmit = !!section && description.trim().length > 0 && !sending;

  const btn = (active: boolean): React.CSSProperties => ({
    padding: "8px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: active ? "#1a1a1a" : "#f5f5f5", color: active ? "#fff" : "#444", border: "none",
  });

  const renderIssue = (i: Issue) => (
    <div key={i.id} style={{ ...cardStyle, marginBottom: 8, padding: "14px 18px", opacity: i.status === "resolved" ? 0.6 : 1 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {i.has_photo && (
          <img src={`/api/issues/photo?id=${i.id}`} alt="" onClick={() => setLightbox(i.id)}
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0, cursor: "pointer", background: "#eee" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: "#f5f5f5", borderRadius: 12, padding: "3px 10px" }}>{sectionLabel(i.section)}</span>
            <span style={{ fontSize: 11, color: i.status === "open" ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{i.status === "open" ? t.open : t.resolved}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{i.description}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>{t.by} <strong style={{ color: "#666" }}>{i.reported_by}</strong> · {formatWhen(i.created_at, lang)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        {i.reported_by === user && (
          <button disabled={busyId === i.id} onClick={() => remove(i)} style={{ ...btn(false), color: "#dc2626" }}>{t.delete}</button>
        )}
        <button disabled={busyId === i.id} onClick={() => setStatus(i, i.status === "open" ? "resolved" : "open")} style={btn(i.status === "open")}>
          {i.status === "open" ? "✓ " + t.markResolved : t.reopen}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.title}</h2>

      {/* Notifications */}
      <div style={{ ...cardStyle, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>{pushState === "on" ? "🔔" : "🔕"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{t.notifTitle}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {pushState === "on" ? t.notifOn : pushState === "denied" ? t.notifDenied : pushState === "ios-browser" ? t.notifIOS : pushState === "unsupported" ? t.notifUnsupported : t.notifOff}
          </div>
        </div>
        {(pushState === "on" || pushState === "off" || pushState === "busy") && (
          <button disabled={pushState === "busy"} onClick={togglePush} style={{ ...btn(pushState !== "on"), flexShrink: 0, opacity: pushState === "busy" ? 0.6 : 1 }}>
            {pushState === "on" ? t.notifDisable : t.notifEnable}
          </button>
        )}
      </div>

      {/* Report form */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t.reportTitle}</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.section}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {ISSUE_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} style={btn(section === s.id)}>{s.emoji} {lang === "de" ? s.de : s.en}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.describe}</div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.placeholder} rows={3} maxLength={2000}
          style={{ width: "100%", boxSizing: "border-box", border: "2px solid #e5e5e5", borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", marginBottom: 12 }} />
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
        {photo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <img src={photo.preview} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} />
            <button onClick={() => fileRef.current?.click()} style={btn(false)}>{t.changePhoto}</button>
            <button onClick={() => setPhoto(null)} style={{ ...btn(false), color: "#dc2626" }}>{t.removePhoto}</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{ ...btn(false), marginBottom: 12 }}>📷 {t.addPhoto}</button>
        )}
        {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button disabled={!canSubmit} onClick={submit}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: canSubmit ? "#1a1a1a" : "#ccc", color: "#fff", fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}>
          {sending ? t.submitting : t.submit}
        </button>
      </div>

      {/* List */}
      {issues === null && !loadFailed && <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 20 }}>{t.loading}</div>}
      {loadFailed && (
        <div style={{ ...cardStyle, textAlign: "center", color: "#dc2626", fontSize: 13 }}>
          {t.loadError}<br />
          <button onClick={load} style={{ ...btn(true), marginTop: 10 }}>{t.retry}</button>
        </div>
      )}
      {issues !== null && issues.length === 0 && <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 20 }}>{t.empty}</div>}
      {open.length > 0 && <>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#999", margin: "8px 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>{t.open} — {open.length}</div>
        {open.map(renderIssue)}
      </>}
      {done.length > 0 && <>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#999", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>{t.resolved} — {done.length}</div>
        {done.map(renderIssue)}
      </>}

      {/* Lightbox */}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <img src={`/api/issues/photo?id=${lightbox}`} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </>
  );
}
