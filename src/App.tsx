import { useState, useEffect } from "react";

const RESIDENTS = ["Abhishek", "Vishwa", "Anas", "Arunima", "Vahhuli"];
const RESIDENT_COLORS = { Abhishek: "#1a1a1a", Vishwa: "#1a1a1a", Anas: "#1a1a1a", Arunima: "#1a1a1a", Vahhuli: "#1a1a1a" };

// Duties are compared by calendar date, never by clock time — otherwise a duty
// silently rolls over at midnight on its own last day.
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysBetween = (from, to) => Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
// A duty week runs Monday through the end of Sunday.
const isInTrashWeek = (td, date) => { const n = daysBetween(td.startDay, date); return n >= 0 && n <= 6; };
// Anything further out than this stays hidden on the home screen.
const LOOKAHEAD_DAYS = 7;

const T = {
  en: {
    appName: "Goethestrasse 31",
    tagline: "Your Home,\nAlways Organised.",
    sub: "House rules, cleaning schedules and waste guides for all residents.",
    begin: "Enter your home",
    residents: "Residents",
    joined: "joined",
    selectName: "Select your name to continue",
    home: "Home", rules: "Rules", cleaning: "Cleaning", trash: "Trash", waste: "Waste", laws: "Laws",
    trashThisWeek: "Trash Duty This Week",
    trashNextWeek: "Trash Duty Next Week",
    noTrashDuty: "No Trash Duty",
    noTrashDutySub: "Nothing scheduled for this week.",
    nextCleaning: "Next Cleaning Day",
    cleaningToday: "Cleaning Day — Today",
    noCleaningThisWeek: "No Cleaning This Week",
    nextCleaningOn: "Next cleaning day",
    noCleaningPlanned: "Nothing else scheduled this year.",
    inDays: (n) => (n === 1 ? "in 1 day" : `in ${n} days`),
    tomorrow: "Tomorrow",
    quickReminders: "Quick Reminders",
    rem1: "Quiet hours: 22:00–07:00 & Sundays all day",
    rem2: "Squeegee the shower glass after every shower",
    rem3: "Switch off lights when leaving a room",
    houseRules: "House Rules", hausordnung: "Hausordnung",
    cleaningSchedule: "Cleaning Schedule", cleaningSub: "Every 2 weeks on Saturday. Corridors/stairs only on Saturdays.",
    trashDuty: "Trash Duty 2026", trashSub: "Put all bins out by 20:00 the evening before pickup.",
    wasteGuide: "Waste Separation Guide",
    germanlaws: "German Rules & Laws",
    yesGoes: "✓ YES — Goes here", noGoes: "✗ NO — Does not go here",
    outBy: "Put out by", putOut: "Put out by",
    thisWeek: "This week",
    closeLink: "Close Invite Link", linkClosed: "Invite link is closed. All residents have joined.",
    signOut: "Sign out",
    calendarView: "Calendar", listView: "List",
    week: "Week of",
    expand: "View tasks",
    loggedAs: "Logged in as",
  },
  de: {
    appName: "Goethestrasse 31",
    tagline: "Dein Zuhause,\nimmer organisiert.",
    sub: "Hausordnung, Reinigungspläne und Mülltrennung für alle Bewohner.",
    begin: "Zuhause betreten",
    residents: "Bewohner",
    joined: "beigetreten",
    selectName: "Wähle deinen Namen aus",
    home: "Start", rules: "Regeln", cleaning: "Reinigung", trash: "Müll", waste: "Trennung", laws: "Gesetze",
    trashThisWeek: "Müllpflicht diese Woche",
    trashNextWeek: "Müllpflicht nächste Woche",
    noTrashDuty: "Keine Müllpflicht",
    noTrashDutySub: "Diese Woche ist nichts geplant.",
    nextCleaning: "Nächster Reinigungstag",
    cleaningToday: "Reinigungstag — Heute",
    noCleaningThisWeek: "Diese Woche keine Reinigung",
    nextCleaningOn: "Nächster Reinigungstag",
    noCleaningPlanned: "Dieses Jahr ist nichts mehr geplant.",
    inDays: (n) => (n === 1 ? "in 1 Tag" : `in ${n} Tagen`),
    tomorrow: "Morgen",
    quickReminders: "Schnelle Erinnerungen",
    rem1: "Ruhezeiten: 22:00–07:00 & Sonntags ganztägig",
    rem2: "Duschwand nach jeder Dusche abziehen",
    rem3: "Licht beim Verlassen des Raumes ausschalten",
    houseRules: "Hausordnung", hausordnung: "House Rules",
    cleaningSchedule: "Reinigungsplan", cleaningSub: "Alle 2 Wochen samstags. Flure/Treppen nur samstags.",
    trashDuty: "Müllpflicht 2026", trashSub: "Alle Tonnen bis 20:00 Uhr am Vorabend herausstellen.",
    wasteGuide: "Mülltrennung",
    germanlaws: "Deutsche Regeln & Gesetze",
    yesGoes: "✓ JA — Gehört hier rein", noGoes: "✗ NEIN — Gehört nicht hier rein",
    outBy: "Herausstellen bis", putOut: "Herausstellen bis",
    thisWeek: "Diese Woche",
    closeLink: "Einladungslink schließen", linkClosed: "Einladungslink geschlossen. Alle Bewohner sind beigetreten.",
    signOut: "Abmelden",
    calendarView: "Kalender", listView: "Liste",
    week: "Woche",
    expand: "Aufgaben anzeigen",
    loggedAs: "Eingeloggt als",
  }
};

const HOUSE_RULES = [
  { en: "Quiet Hours", de: "Ruhezeiten", detail_en: "Weekdays 22:00–07:00 | Sundays & Public Holidays: all day | Midday: 13:00–15:00", detail_de: "Wochentags 22:00–07:00 | Sonn- und Feiertage: ganztägig | Mittagsruhe 13:00–15:00", icon: "🌙" },
  { en: "Guests", de: "Gäste", detail_en: "Inform the group chat at least ONE DAY BEFORE bringing guests.", detail_de: "Gäste mindestens einen Tag vorher in der Gruppe ankündigen.", icon: "👥" },
  { en: "Kitchen – After Cooking", de: "Küche – nach dem Kochen", detail_en: "Clean stovetop, oven, microwave and counter after every use.", detail_de: "Herd, Backofen, Mikrowelle und Arbeitsplatte nach jeder Benutzung reinigen.", icon: "🍳" },
  { en: "Lower Toilet – Shower Glass", de: "Unteres WC – Duschwand", detail_en: "Wipe the glass shower cabinet with the squeegee after every shower — no exceptions.", detail_de: "Nach jeder Dusche die Glaswand mit dem Abzieher abwischen — ausnahmslos.", icon: "🚿" },
  { en: "Lights & Energy", de: "Licht & Energie", detail_en: "Switch off all lights when leaving a room. No electronics on standby.", detail_de: "Licht beim Verlassen des Raumes ausschalten. Geräte nicht im Standby lassen.", icon: "💡" },
  { en: "Noise & Music", de: "Lärm & Musik", detail_en: "Use headphones after 22:00. No drilling or loud DIY on Sundays or public holidays.", detail_de: "Nach 22:00 Kopfhörer benutzen. Keine Bohrarbeiten an Sonn- und Feiertagen.", icon: "🎵" },
  { en: "Common Areas", de: "Gemeinschaftsbereiche", detail_en: "Keep hallways, staircase and entrance clear. Shoes on the rack only.", detail_de: "Flure, Treppenhaus und Eingang frei halten. Schuhe immer auf das Regal.", icon: "🏠" },
  { en: "Laundry", de: "Wäsche", detail_en: "Collect laundry promptly. Do not leave wet laundry sitting in the drum.", detail_de: "Wäsche sofort nach dem Waschen aus der Maschine nehmen.", icon: "👕" },
  { en: "Cleaning Mops & Towels", de: "Putztücher & Mopps", detail_en: "After every biweekly cleaning: wash all mops, cloths and doormats. Dry in backyard.", detail_de: "Nach jeder Reinigung: Alle Putzmittel waschen, im Hinterhof trocknen, zurücklegen.", icon: "🧹" },
  { en: "Smoking", de: "Rauchen", detail_en: "Strictly NO smoking inside the house. Smoke only outside, away from windows.", detail_de: "Rauchen im Haus ist streng verboten. Nur draußen, entfernt von Fenstern.", icon: "🚭" },
  { en: "Waste Separation", de: "Mülltrennung", detail_en: "Always separate waste correctly — see Waste Guide. Wrong bins can result in extra fees.", detail_de: "Müll korrekt trennen — siehe Mülltrennung. Falsch befüllte Tonnen verursachen Mehrkosten.", icon: "♻️" },
  { en: "Conflicts", de: "Konflikte", detail_en: "Resolve disagreements directly and respectfully. Involve a neutral mediator if needed.", detail_de: "Streitigkeiten direkt und respektvoll klären. Bei Bedarf neutrale Vermittlung.", icon: "🤝" },
  { en: "Damage & Maintenance", de: "Schäden", detail_en: "Report any damage or malfunction to the group immediately — do not wait.", detail_de: "Schäden oder Defekte sofort in der Gruppe melden.", icon: "🔧" },
];

const CLEANING_ROTATION = [
  { date: "30 May", day: new Date(2026,4,30), Abhishek: "Kitchen", Vishwa: "Lower WC", Anas: "Upper WC", Arunima: "Hall/Dining", Vahhuli: "Common" },
  { date: "13 Jun", day: new Date(2026,5,13), Abhishek: "Common", Vishwa: "Kitchen", Anas: "Hall/Dining", Arunima: "Lower WC", Vahhuli: "Upper WC" },
  { date: "27 Jun", day: new Date(2026,5,27), Abhishek: "Upper WC", Vishwa: "Common", Anas: "Lower WC", Arunima: "Kitchen", Vahhuli: "Hall/Dining" },
  { date: "11 Jul", day: new Date(2026,6,11), Abhishek: "Hall/Dining", Vishwa: "Upper WC", Anas: "Kitchen", Arunima: "Common", Vahhuli: "Lower WC" },
  { date: "25 Jul", day: new Date(2026,6,25), Abhishek: "Lower WC", Vishwa: "Hall/Dining", Anas: "Common", Arunima: "Upper WC", Vahhuli: "Kitchen" },
  { date: "08 Aug", day: new Date(2026,7,8), Abhishek: "Kitchen", Vishwa: "Lower WC", Anas: "Upper WC", Arunima: "Hall/Dining", Vahhuli: "Common" },
  { date: "22 Aug", day: new Date(2026,7,22), Abhishek: "Common", Vishwa: "Kitchen", Anas: "Hall/Dining", Arunima: "Lower WC", Vahhuli: "Upper WC" },
  { date: "05 Sep", day: new Date(2026,8,5), Abhishek: "Upper WC", Vishwa: "Common", Anas: "Lower WC", Arunima: "Kitchen", Vahhuli: "Hall/Dining" },
  { date: "19 Sep", day: new Date(2026,8,19), Abhishek: "Hall/Dining", Vishwa: "Upper WC", Anas: "Kitchen", Arunima: "Common", Vahhuli: "Lower WC" },
  { date: "03 Oct", day: new Date(2026,9,3), Abhishek: "Lower WC", Vishwa: "Hall/Dining", Anas: "Common", Arunima: "Upper WC", Vahhuli: "Kitchen" },
  { date: "17 Oct", day: new Date(2026,9,17), Abhishek: "Kitchen", Vishwa: "Lower WC", Anas: "Upper WC", Arunima: "Hall/Dining", Vahhuli: "Common" },
  { date: "31 Oct", day: new Date(2026,9,31), Abhishek: "Common", Vishwa: "Kitchen", Anas: "Hall/Dining", Arunima: "Lower WC", Vahhuli: "Upper WC" },
  { date: "14 Nov", day: new Date(2026,10,14), Abhishek: "Upper WC", Vishwa: "Common", Anas: "Lower WC", Arunima: "Kitchen", Vahhuli: "Hall/Dining" },
  { date: "28 Nov", day: new Date(2026,10,28), Abhishek: "Hall/Dining", Vishwa: "Upper WC", Anas: "Kitchen", Arunima: "Common", Vahhuli: "Lower WC" },
  { date: "12 Dec", day: new Date(2026,11,12), Abhishek: "Lower WC", Vishwa: "Hall/Dining", Anas: "Common", Arunima: "Upper WC", Vahhuli: "Kitchen" },
  { date: "26 Dec", day: new Date(2026,11,26), Abhishek: "Kitchen", Vishwa: "Lower WC", Anas: "Upper WC", Arunima: "Hall/Dining", Vahhuli: "Common" },
];

const CLEANING_TASKS = {
  Kitchen: ["Deep clean the stove", "Pull out dishwasher & stove, clean behind", "Clean upper ceramic cabinets", "Vacuum + mop the floor", "Scrub the sink", "Clean extractor hood net"],
  "Upper WC": ["Clean the bathtub", "Clean toilet bowl", "Clean basin", "Clean mirror", "Clean all taps", "Mop the floor", "Wash & dry doormats/mops"],
  "Lower WC": ["Clean toilet bowl", "Wipe glass shower with squeegee", "Clean shower/bathing area", "Clean all taps", "Clean mirror", "Mop the floor", "Wash & dry doormats/mops"],
  "Hall/Dining": ["Dust sofas, cabinets & wooden shelves", "Vacuum floor in dining & hall", "Clean dining table top", "Clean glass wall (hall)", "Dust shelves and furniture"],
  Common: ["Vacuum upper corridor", "Vacuum lower corridor", "Vacuum staircase", "Clean shoe rack area", "Wipe bannisters & door handles"],
};

const TRASH_DUTY = [
  { week: "05–11 Jan", person: "Vishwa", collections: ["Mon 05 Jan: Gelbe Tonne","Tue 06 Jan: Papiertonne","Wed 07 Jan: Restmüll"], putOut: "Sun 04 Jan, 20:00", startDay: new Date(2026,0,5) },
  { week: "12–18 Jan", person: "Anas", collections: ["Wed 14 Jan: Biotonne"], putOut: "Tue 13 Jan, 20:00", startDay: new Date(2026,0,12) },
  { week: "19–25 Jan", person: "Arunima", collections: ["Mon 19 Jan: Gelbe Tonne","Wed 21 Jan: Restmüll"], putOut: "Sun 18 Jan, 20:00", startDay: new Date(2026,0,19) },
  { week: "26 Jan–01 Feb", person: "Vahhuli", collections: ["Wed 28 Jan: Biotonne"], putOut: "Tue 27 Jan, 20:00", startDay: new Date(2026,0,26) },
  { week: "02–08 Feb", person: "Abhishek", collections: ["Mon 02 Feb: Gelbe Tonne","Tue 03 Feb: Papiertonne","Wed 04 Feb: Restmüll"], putOut: "Sun 01 Feb, 20:00", startDay: new Date(2026,1,2) },
  { week: "09–15 Feb", person: "Vishwa", collections: ["Wed 11 Feb: Biotonne"], putOut: "Tue 10 Feb, 20:00", startDay: new Date(2026,1,9) },
  { week: "16–22 Feb", person: "Anas", collections: ["Mon 16 Feb: Gelbe Tonne","Wed 18 Feb: Restmüll"], putOut: "Sun 15 Feb, 20:00", startDay: new Date(2026,1,16) },
  { week: "23 Feb–01 Mar", person: "Arunima", collections: ["Wed 25 Feb: Biotonne"], putOut: "Tue 24 Feb, 20:00", startDay: new Date(2026,1,23) },
  { week: "02–08 Mar", person: "Vahhuli", collections: ["Mon 02 Mar: Gelbe Tonne","Tue 03 Mar: Papiertonne","Wed 04 Mar: Restmüll"], putOut: "Sun 01 Mar, 20:00", startDay: new Date(2026,2,2) },
  { week: "09–15 Mar", person: "Abhishek", collections: ["Wed 11 Mar: Biotonne"], putOut: "Tue 10 Mar, 20:00", startDay: new Date(2026,2,9) },
  { week: "16–22 Mar", person: "Vishwa", collections: ["Mon 16 Mar: Gelbe Tonne","Wed 18 Mar: Restmüll"], putOut: "Sun 15 Mar, 20:00", startDay: new Date(2026,2,16) },
  { week: "23–29 Mar", person: "Anas", collections: ["Wed 25 Mar: Biotonne","Sat 28 Mar: Gelbe Tonne"], putOut: "Tue 24 Mar, 20:00", startDay: new Date(2026,2,23) },
  { week: "30 Mar–05 Apr", person: "Arunima", collections: ["Mon 30 Mar: Papiertonne","Tue 31 Mar: Restmüll"], putOut: "Sun 29 Mar, 20:00", startDay: new Date(2026,2,30) },
  { week: "06–12 Apr", person: "Vahhuli", collections: ["Thu 09 Apr: Biotonne"], putOut: "Wed 08 Apr, 20:00", startDay: new Date(2026,3,6) },
  { week: "13–19 Apr", person: "Abhishek", collections: ["Mon 13 Apr: Gelbe Tonne","Wed 15 Apr: Restmüll"], putOut: "Sun 12 Apr, 20:00", startDay: new Date(2026,3,13) },
  { week: "20–26 Apr", person: "Vishwa", collections: ["Wed 22 Apr: Biotonne"], putOut: "Tue 21 Apr, 20:00", startDay: new Date(2026,3,20) },
  { week: "27 Apr–03 May", person: "Anas", collections: ["Mon 27 Apr: Gelbe Tonne","Tue 28 Apr: Papiertonne","Wed 29 Apr: Restmüll"], putOut: "Sun 26 Apr, 20:00", startDay: new Date(2026,3,27) },
  { week: "04–10 May", person: "Arunima", collections: ["Wed 06 May: Biotonne"], putOut: "Tue 05 May, 20:00", startDay: new Date(2026,4,4) },
  { week: "11–17 May", person: "Vahhuli", collections: ["Mon 11 May: Gelbe Tonne","Wed 13 May: Restmüll"], putOut: "Sun 10 May, 20:00", startDay: new Date(2026,4,11) },
  { week: "18–24 May", person: "Abhishek", collections: ["Wed 20 May: Biotonne"], putOut: "Tue 19 May, 20:00", startDay: new Date(2026,4,18) },
  { week: "25–31 May", person: "Vishwa", collections: ["Tue 26 May: Gelbe Tonne","Wed 27 May: Papiertonne","Thu 28 May: Restmüll"], putOut: "Mon 25 May, 20:00", startDay: new Date(2026,4,25) },
  { week: "01–07 Jun", person: "Anas", collections: ["Wed 03 Jun: Biotonne"], putOut: "Tue 02 Jun, 20:00", startDay: new Date(2026,5,1) },
  { week: "08–14 Jun", person: "Arunima", collections: ["Mon 08 Jun: Gelbe Tonne","Wed 10 Jun: Restmüll"], putOut: "Sun 07 Jun, 20:00", startDay: new Date(2026,5,8) },
  { week: "15–21 Jun", person: "Vahhuli", collections: ["Wed 17 Jun: Biotonne"], putOut: "Tue 16 Jun, 20:00", startDay: new Date(2026,5,15) },
  { week: "22–28 Jun", person: "Abhishek", collections: ["Mon 22 Jun: Gelbe Tonne","Tue 23 Jun: Papiertonne","Wed 24 Jun: Restmüll"], putOut: "Sun 21 Jun, 20:00", startDay: new Date(2026,5,22) },
  { week: "29 Jun–05 Jul", person: "Vishwa", collections: ["Wed 01 Jul: Biotonne"], putOut: "Tue 30 Jun, 20:00", startDay: new Date(2026,5,29) },
  { week: "06–12 Jul", person: "Anas", collections: ["Mon 06 Jul: Gelbe Tonne","Wed 08 Jul: Restmüll"], putOut: "Sun 05 Jul, 20:00", startDay: new Date(2026,6,6) },
  { week: "13–19 Jul", person: "Arunima", collections: ["Wed 15 Jul: Biotonne"], putOut: "Tue 14 Jul, 20:00", startDay: new Date(2026,6,13) },
  { week: "20–26 Jul", person: "Vahhuli", collections: ["Mon 20 Jul: Gelbe Tonne","Tue 21 Jul: Papiertonne","Wed 22 Jul: Restmüll"], putOut: "Sun 19 Jul, 20:00", startDay: new Date(2026,6,20) },
  { week: "27 Jul–02 Aug", person: "Abhishek", collections: ["Wed 29 Jul: Biotonne"], putOut: "Tue 28 Jul, 20:00", startDay: new Date(2026,6,27) },
  { week: "03–09 Aug", person: "Vishwa", collections: ["Mon 03 Aug: Gelbe Tonne","Wed 05 Aug: Restmüll"], putOut: "Sun 02 Aug, 20:00", startDay: new Date(2026,7,3) },
  { week: "10–16 Aug", person: "Anas", collections: ["Wed 12 Aug: Biotonne"], putOut: "Tue 11 Aug, 20:00", startDay: new Date(2026,7,10) },
  { week: "17–23 Aug", person: "Arunima", collections: ["Mon 17 Aug: Gelbe Tonne","Tue 18 Aug: Papiertonne","Wed 19 Aug: Restmüll"], putOut: "Sun 16 Aug, 20:00", startDay: new Date(2026,7,17) },
  { week: "24–30 Aug", person: "Vahhuli", collections: ["Wed 26 Aug: Biotonne"], putOut: "Tue 25 Aug, 20:00", startDay: new Date(2026,7,24) },
  { week: "31 Aug–06 Sep", person: "Abhishek", collections: ["Mon 31 Aug: Gelbe Tonne","Wed 02 Sep: Restmüll"], putOut: "Sun 30 Aug, 20:00", startDay: new Date(2026,7,31) },
  { week: "07–13 Sep", person: "Vishwa", collections: ["Wed 09 Sep: Biotonne"], putOut: "Tue 08 Sep, 20:00", startDay: new Date(2026,8,7) },
  { week: "14–20 Sep", person: "Anas", collections: ["Mon 14 Sep: Gelbe Tonne","Tue 15 Sep: Papiertonne","Wed 16 Sep: Restmüll"], putOut: "Sun 13 Sep, 20:00", startDay: new Date(2026,8,14) },
  { week: "21–27 Sep", person: "Arunima", collections: ["Wed 23 Sep: Biotonne"], putOut: "Tue 22 Sep, 20:00", startDay: new Date(2026,8,21) },
  { week: "28 Sep–04 Oct", person: "Vahhuli", collections: ["Mon 28 Sep: Gelbe Tonne","Wed 30 Sep: Restmüll"], putOut: "Sun 27 Sep, 20:00", startDay: new Date(2026,8,28) },
  { week: "05–11 Oct", person: "Abhishek", collections: ["Wed 07 Oct: Biotonne"], putOut: "Tue 06 Oct, 20:00", startDay: new Date(2026,9,5) },
  { week: "12–18 Oct", person: "Vishwa", collections: ["Mon 12 Oct: Gelbe Tonne","Tue 13 Oct: Papiertonne","Wed 14 Oct: Restmüll"], putOut: "Sun 11 Oct, 20:00", startDay: new Date(2026,9,12) },
  { week: "19–25 Oct", person: "Anas", collections: ["Wed 21 Oct: Biotonne"], putOut: "Tue 20 Oct, 20:00", startDay: new Date(2026,9,19) },
  { week: "26 Oct–01 Nov", person: "Arunima", collections: ["Mon 26 Oct: Gelbe Tonne","Wed 28 Oct: Restmüll"], putOut: "Sun 25 Oct, 20:00", startDay: new Date(2026,9,26) },
  { week: "02–08 Nov", person: "Vahhuli", collections: ["Wed 04 Nov: Biotonne"], putOut: "Tue 03 Nov, 20:00", startDay: new Date(2026,10,2) },
  { week: "09–15 Nov", person: "Abhishek", collections: ["Mon 09 Nov: Gelbe Tonne","Tue 10 Nov: Papiertonne","Wed 11 Nov: Restmüll"], putOut: "Sun 08 Nov, 20:00", startDay: new Date(2026,10,9) },
  { week: "16–22 Nov", person: "Vishwa", collections: ["Wed 18 Nov: Biotonne"], putOut: "Tue 17 Nov, 20:00", startDay: new Date(2026,10,16) },
  { week: "23–29 Nov", person: "Anas", collections: ["Mon 23 Nov: Gelbe Tonne","Wed 25 Nov: Restmüll"], putOut: "Sun 22 Nov, 20:00", startDay: new Date(2026,10,23) },
  { week: "30 Nov–06 Dec", person: "Arunima", collections: ["Wed 02 Dec: Biotonne"], putOut: "Tue 01 Dec, 20:00", startDay: new Date(2026,10,30) },
  { week: "07–13 Dec", person: "Vahhuli", collections: ["Mon 07 Dec: Gelbe Tonne","Tue 08 Dec: Papiertonne","Wed 09 Dec: Restmüll"], putOut: "Sun 06 Dec, 20:00", startDay: new Date(2026,11,7) },
  { week: "14–20 Dec", person: "Abhishek", collections: ["Wed 16 Dec: Biotonne","Sat 19 Dec: Gelbe Tonne"], putOut: "Tue 15 Dec, 20:00", startDay: new Date(2026,11,14) },
  { week: "21–27 Dec", person: "Vishwa", collections: ["Tue 22 Dec: Restmüll"], putOut: "Mon 21 Dec, 20:00", startDay: new Date(2026,11,21) },
  { week: "28 Dec–03 Jan", person: "Anas", collections: ["Wed 30 Dec: Biotonne"], putOut: "Tue 29 Dec, 20:00", startDay: new Date(2026,11,28) },
];

const WASTE_GUIDE = [
  { name: "Restmüll", nameDE: "Restmüll", color: "#6b7280", emoji: "🗑️", schedule_en: "Every 2 weeks (Wednesdays)", schedule_de: "Alle 2 Wochen (Mittwochs)", yes_en: ["Dirty non-recyclable plastic","Cigarette butts","Vacuum cleaner bags","Broken crockery/ceramics","Nappies & hygiene products","Cat litter","Mixed material packaging","Cooled ash (sealed bag)"], yes_de: ["Schmutzige nicht recycelbare Kunststoffe","Zigarettenstummel","Staubsaugerbeutel","Zerbrochenes Geschirr/Keramik","Windeln & Hygieneartikel","Katzenstreu","Verbundverpackungen","Abgekühlte Asche (versiegelt)"], no_en: ["Food waste → Biotonne","Paper → Papiertonne","Plastic/metal packaging → Gelbe Tonne","Glass → Glascontainer","Electronics → Recyclinghof"], no_de: ["Lebensmittelabfälle → Biotonne","Papier → Papiertonne","Kunststoff/Metall → Gelbe Tonne","Glas → Glascontainer","Elektronik → Recyclinghof"] },
  { name: "Biotonne", nameDE: "Biotonne", color: "#16a34a", emoji: "🌿", schedule_en: "Every 2 weeks (Wednesdays)", schedule_de: "Alle 2 Wochen (Mittwochs)", yes_en: ["Fruit & vegetable scraps","Coffee grounds + filters","Tea bags","Eggshells","Cooked food leftovers","Garden waste","Flowers & plants","Nutshells","Hair, nail clippings"], yes_de: ["Obst- & Gemüseabfälle","Kaffeesatz + Filter","Teebeutel","Eierschalen","Gekochte Speisereste","Gartenabfälle","Blumen & Pflanzen","Nussschalen","Haare, Nagelschnitt"], no_en: ["Plastic bags (even compostable)","Large amounts of meat/fish","Cooking oil/fats → Recyclinghof","Ash","Diapers","Glass","Cat litter"], no_de: ["Plastiktüten (auch kompostierbare)","Große Mengen Fleisch/Fisch","Speiseöl → Recyclinghof","Asche","Windeln","Glas","Katzenstreu"] },
  { name: "Papiertonne", nameDE: "Papiertonne", color: "#2563eb", emoji: "📄", schedule_en: "Every ~4 weeks (Tuesdays)", schedule_de: "Alle ~4 Wochen (Dienstags)", yes_en: ["Newspapers, magazines, flyers","Cardboard boxes (flattened!)","Paper bags, envelopes","Cereal/food packaging boxes (dry)","Office/printer paper","Egg cartons (paper)","Books, catalogues","Plain wrapping paper (no foil)"], yes_de: ["Zeitungen, Zeitschriften, Flyer","Kartons (flachgedrückt!)","Papiertüten, Umschläge","Leere Lebensmittelverpackungen (trocken)","Büro-/Druckerpapier","Eierkartons (Papier)","Bücher, Kataloge","Normales Geschenkpapier (kein Folie)"], no_en: ["Wet/soiled paper","Tissues & kitchen towels → Restmüll","Wax/carbon paper","Cardboard contaminated with food","Drink cartons → Gelbe Tonne","Wallpaper","Photos"], no_de: ["Nasses/verschmutztes Papier","Taschentücher → Restmüll","Wachs-/Kohlepapier","Lebensmittelverunreinigter Karton","Getränkekartons → Gelbe Tonne","Tapeten","Fotos"] },
  { name: "Gelbe Tonne", nameDE: "Gelbe Tonne", color: "#ca8a04", emoji: "♻️", schedule_en: "Every 2 weeks (Mondays)", schedule_de: "Alle 2 Wochen (Montags)", yes_en: ["Plastic bottles & containers","Metal cans & tins","Drink cartons / Tetrapak","Plastic bags & films","Styrofoam (packaging only)","Aluminium trays & foil","Items with Gruener Punkt symbol"], yes_de: ["Plastikflaschen & Behälter","Metalldosen & Konservendosen","Getränkekartons / Tetrapak","Plastiktüten & Folien","Styropor (nur Verpackung)","Aluminiumschalen & Folie","Artikel mit Grünem Punkt"], no_en: ["Non-packaging plastics → Recyclinghof","Glass","Paper → Papiertonne","Electronic waste","Hazardous materials"], no_de: ["Nicht-Verpackungskunststoffe → Recyclinghof","Glas","Papier → Papiertonne","Elektronikschrott","Gefahrstoffe"] },
];

const GERMAN_LAWS = [
  { title_en: "Ruhezeit & Ruhetag", title_de: "Ruhezeit & Ruhetag", detail_en: "Night quiet: 22:00–07:00 every day. Sundays and public holidays: all day — no vacuuming, no drilling, no loud music. Midday rest 13:00–15:00 is customary. Violations can lead to complaints to the landlord or police.", detail_de: "Nachtruhe: 22:00–07:00 täglich. Sonn- und Feiertage: ganztägig — kein Staubsaugen, kein Bohren, keine laute Musik. Mittagsruhe 13:00–15:00 ist üblich.", icon: "🌙" },
  { title_en: "Mülltrennung", title_de: "Mülltrennung", detail_en: "German law (Kreislaufwirtschaftsgesetz) requires proper waste separation. Fines can apply for contaminating recycling streams.", detail_de: "Das deutsche Gesetz (Kreislaufwirtschaftsgesetz) schreibt korrekte Mülltrennung vor. Bei Verunreinigung von Recyclingströmen können Bußgelder verhängt werden.", icon: "♻️" },
  { title_en: "Neighbour Disputes", title_de: "Nachbarschaftsstreitigkeiten", detail_en: "You have the right to document noise violations and notify the landlord in writing. Always try a direct, friendly conversation first before escalating.", detail_de: "Sie haben das Recht, Lärmverstöße zu dokumentieren und den Vermieter schriftlich zu informieren. Versuchen Sie immer zuerst ein direktes, freundliches Gespräch.", icon: "🤝" },
  { title_en: "Smoking in Shared Spaces", title_de: "Rauchen in Gemeinschaftsräumen", detail_en: "Smoking in shared indoor spaces (corridors, staircase) is illegal in Germany. Smoke only outside, away from windows and doors.", detail_de: "Rauchen in gemeinsamen Innenräumen (Flure, Treppenhaus) ist in Deutschland illegal. Nur draußen rauchen, entfernt von Fenstern und Türen.", icon: "🚭" },
  { title_en: "Pets", title_de: "Haustiere", detail_en: "Pets require landlord approval in German rental contracts. Always check the Mietvertrag before bringing any animal into the house.", detail_de: "Haustiere erfordern die Genehmigung des Vermieters im Mietvertrag. Prüfen Sie immer den Mietvertrag, bevor Sie ein Tier ins Haus bringen.", icon: "🐾" },
  { title_en: "Keys & Security", title_de: "Schlüssel & Sicherheit", detail_en: "Always lock the front door when the last person leaves. Lost keys must be reported to the landlord immediately.", detail_de: "Haustür immer abschließen, wenn die letzte Person geht. Verlorene Schlüssel müssen sofort dem Vermieter gemeldet werden.", icon: "🔑" },
];

const PERSON_INITIALS = n => n[0];
const PERSON_BG = ["#e8e8e8","#d4d4d4","#c0c0c0","#acacac","#989898"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function CalendarMonth({ year, month, trashData, cleanData, lang, user }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDayEvents = (d) => {
    if (!d) return [];
    const dt = new Date(year, month, d);
    const events = [];
    trashData.forEach(t => {
      const end = new Date(t.startDay); end.setDate(end.getDate() + 6);
      if (dt >= t.startDay && dt <= end) {
        t.collections.forEach(c => {
          const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const abbr = c.split(" ")[0];
          const cDay = parseInt(c.split(" ")[1]);
          if (cDay === d) events.push({ type: "trash", label: c.split(":")[1].trim(), person: t.person });
        });
      }
    });
    cleanData.forEach(r => {
      if (r.day.getDate() === d && r.day.getMonth() === month && r.day.getFullYear() === year) {
        events.push({ type: "clean", label: r[user] || "Cleaning", person: user });
      }
    });
    return events;
  };

  const today = new Date();
  const isToday = (d) => d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {["M","T","W","T","F","S","S"].map((d,i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#999", padding: "4px 0", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          const evs = getDayEvents(d);
          const hasTr = evs.some(e => e.type === "trash");
          const hasCl = evs.some(e => e.type === "clean");
          return (
            <div key={i} style={{ minHeight: 40, borderRadius: 8, background: isToday(d) ? "#1a1a1a" : d ? "#f5f5f5" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "4px 2px", position: "relative" }}>
              {d && <span style={{ fontSize: 11, fontWeight: isToday(d) ? 700 : 400, color: isToday(d) ? "#fff" : "#1a1a1a" }}>{d}</span>}
              {hasTr && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", marginTop: 2 }} />}
              {hasCl && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", marginTop: 1 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#666" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} /> {lang === "en" ? "Trash pickup" : "Müllabholung"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> {lang === "en" ? "Cleaning day" : "Reinigungstag"}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("splash");
  const [user, setUser] = useState(null);
  const [joinedResidents, setJoinedResidents] = useState([]);
  const [linkClosed, setLinkClosed] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [lang, setLang] = useState("en");
  const [expandedRule, setExpandedRule] = useState(null);
  const [expandedLaw, setExpandedLaw] = useState(null);
  const [selectedWaste, setSelectedWaste] = useState(0);
  const [expandedCleanRow, setExpandedCleanRow] = useState(null);
  const [trashView, setTrashView] = useState("list");
  const [cleanView, setCleanView] = useState("list");
  const [calMonth, setCalMonth] = useState(4); // May
  const [cleanCalMonth, setCleanCalMonth] = useState(4);

  const t = T[lang];

  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as any); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (installPrompt) {
      (installPrompt as any).prompt();
      (installPrompt as any).userChoice.then(() => setInstallPrompt(null));
    }
  }

  useEffect(() => {
    try {
      const u = localStorage.getItem("g31_user");
      const j = localStorage.getItem("g31_joined");
      const c = localStorage.getItem("g31_closed");
      const l = localStorage.getItem("g31_lang");
      if (u) { setUser(u); setPage("app"); }
      if (j) setJoinedResidents(JSON.parse(j));
      if (c === "true") setLinkClosed(true);
      if (l) setLang(l);
    } catch {}
  }, []);

  function handleJoin(name) {
    const nj = joinedResidents.includes(name) ? joinedResidents : [...joinedResidents, name];
    setJoinedResidents(nj);
    setUser(name);
    setPage("app");
    try { localStorage.setItem("g31_user", name); localStorage.setItem("g31_joined", JSON.stringify(nj)); } catch {}
  }
  function toggleLang() {
    const nl = lang === "en" ? "de" : "en";
    setLang(nl);
    try { localStorage.setItem("g31_lang", nl); } catch {}
  }
  function handleCloseLink() {
    setLinkClosed(true);
    try { localStorage.setItem("g31_closed", "true"); } catch {}
  }

  const today = startOfDay(new Date());

  // The week that today falls in — stays put through the whole Sunday.
  const currentTrash = TRASH_DUTY.find(td => isInTrashWeek(td, today));
  // Only outside the published weeks do we look ahead, and never further than a week.
  const upcomingTrash = currentTrash ? null : TRASH_DUTY.find(td => {
    const n = daysBetween(today, td.startDay);
    return n > 0 && n <= LOOKAHEAD_DAYS;
  });
  const trashDuty = currentTrash || upcomingTrash;

  // The cleaning day itself counts all day; the one after it only surfaces a week ahead.
  const nextClean = CLEANING_ROTATION.find(r => daysBetween(today, r.day) >= 0);
  const daysToClean = nextClean ? daysBetween(today, nextClean.day) : null;
  const cleanIsDue = nextClean && daysToClean <= LOOKAHEAD_DAYS;

  const btnStyle = (active) => ({ padding: "10px 0", flex: 1, background: active ? "#1a1a1a" : "transparent", border: "none", borderRadius: 8, color: active ? "#fff" : "#999", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" });
  const cardStyle = { background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" };

  // SPLASH
  if (page === "splash") return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 32px", width: 340, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px", lineHeight: 1.2, whiteSpace: "pre-line" }}>{t.tagline}</h1>
        <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{t.sub}</p>
        <button onClick={() => setPage("login")} style={{ width: "100%", padding: "16px 0", background: "#1a1a1a", border: "none", borderRadius: 50, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>{t.begin}</button>
        {!isStandalone && (installPrompt || isIOS) && (
          <button onClick={handleInstall} style={{ width: "100%", padding: "12px 0", background: "none", border: "1.5px solid #1a1a1a", borderRadius: 50, color: "#1a1a1a", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
            📲 {lang === "en" ? "Add to Home Screen" : "Zum Home-Bildschirm"}
          </button>
        )}
        <button onClick={toggleLang} style={{ background: "none", border: "1px solid #e5e5e5", borderRadius: 50, padding: "8px 20px", color: "#666", fontSize: 13, cursor: "pointer" }}>{lang === "en" ? "🇩🇪 Deutsch" : "🇬🇧 English"}</button>
      </div>

      {/* iOS install guide */}
      {showIOSGuide && (
        <div onClick={() => setShowIOSGuide(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 24px 40px", width: "100%", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
            <div style={{ width: 40, height: 4, background: "#e0e0e0", borderRadius: 2, margin: "0 auto 24px" }} />
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📲 {lang === "en" ? "Add to Home Screen" : "Zum Home-Bildschirm"}</div>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>{lang === "en" ? "Install this app for quick access — no App Store needed." : "App installieren für schnellen Zugriff — kein App Store nötig."}</p>
            {[
              { icon: "⬆️", text: lang === "en" ? 'Tap the Share button at the bottom of Safari' : 'Tippe auf Teilen unten in Safari' },
              { icon: "➕", text: lang === "en" ? 'Scroll down and tap "Add to Home Screen"' : '"Zum Home-Bildschirm" antippen' },
              { icon: "✅", text: lang === "en" ? 'Tap "Add" — done!' : '"Hinzufügen" tippen — fertig!' },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</span>
                <span style={{ fontSize: 15, color: "#333", lineHeight: 1.5 }}>{step.text}</span>
              </div>
            ))}
            <button onClick={() => setShowIOSGuide(false)} style={{ width: "100%", marginTop: 8, padding: "14px 0", background: "#1a1a1a", border: "none", borderRadius: 50, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{lang === "en" ? "Got it" : "Verstanden"}</button>
          </div>
        </div>
      )}
    </div>
  );

  // LOGIN
  if (page === "login") return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", width: 340, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <button onClick={() => setPage("splash")} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← {lang === "en" ? "Back" : "Zurück"}</button>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>Goethestrasse 31</h2>
        <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>Pinneberg 25421</p>
        {linkClosed && !user ? (
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>🔒</div>
            <p style={{ color: "#dc2626", fontSize: 14, margin: "8px 0 0" }}>{t.linkClosed}</p>
          </div>
        ) : (
          <>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{t.selectName}</p>
            {RESIDENTS.map((name, i) => (
              <button key={name} onClick={() => handleJoin(name)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", marginBottom: 8, background: "#f8f8f8", border: "1.5px solid #ececec", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: PERSON_BG[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>{PERSON_INITIALS(name)}</span>
                  {name}
                </span>
                {joinedResidents.includes(name) && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ {lang === "en" ? "Joined" : "Beigetreten"}</span>}
              </button>
            ))}
            <p style={{ color: "#bbb", fontSize: 12, textAlign: "center", marginTop: 12 }}>{joinedResidents.length}/5 {t.joined}</p>
          </>
        )}
      </div>
    </div>
  );

  // APP
  const navItems = [
    { id: "home", emoji: "⌂", label: t.home },
    { id: "rules", emoji: "📋", label: t.rules },
    { id: "cleaning", emoji: "🧹", label: t.cleaning },
    { id: "trash", emoji: "🗑", label: t.trash },
    { id: "waste", emoji: "♻", label: t.waste },
    { id: "laws", emoji: "⚖", label: t.laws },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Goethestrasse 31</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{t.loggedAs} <strong style={{ color: "#1a1a1a" }}>{user}</strong></div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggleLang} style={{ background: "#f5f5f5", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{lang === "en" ? "🇩🇪 DE" : "🇬🇧 EN"}</button>
          {!linkClosed && joinedResidents.length === 5 && (
            <button onClick={handleCloseLink} style={{ background: "#1a1a1a", border: "none", borderRadius: 20, color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🔒</button>
          )}
          <button onClick={() => { setUser(null); setPage("login"); try { localStorage.removeItem("g31_user"); } catch {} }} style={{ background: "#f5f5f5", border: "none", borderRadius: 20, color: "#888", padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>{t.signOut}</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>

        {/* HOME */}
        {activePage === "home" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>👋 {lang === "en" ? `Hello, ${user}` : `Hallo, ${user}`}</h2>

          {/* Residents */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t.residents} — {joinedResidents.length}/5 {t.joined}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {RESIDENTS.map((n,i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: joinedResidents.includes(n) ? "#1a1a1a" : "#f5f5f5", borderRadius: 50, fontSize: 13, fontWeight: 600, color: joinedResidents.includes(n) ? "#fff" : "#aaa" }}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Trash */}
          <div style={{ ...cardStyle, borderLeft: "4px solid #f59e0b" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              {currentTrash ? t.trashThisWeek : trashDuty ? t.trashNextWeek : t.noTrashDuty}
            </div>
            {trashDuty ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{trashDuty.person}</div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{t.week}: {trashDuty.week}</div>
                {trashDuty.collections.map((c,i) => <div key={i} style={{ fontSize: 13, color: "#555", padding: "3px 0" }}>• {c}</div>)}
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>{t.outBy}: {trashDuty.putOut}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#888" }}>{t.noTrashDutySub}</div>
            )}
          </div>

          {/* Cleaning */}
          <div style={{ ...cardStyle, borderLeft: "4px solid #16a34a" }}>
            {cleanIsDue ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  {daysToClean === 0 ? t.cleaningToday : `${t.nextCleaning} — ${nextClean.date} 2026`}
                </div>
                {daysToClean > 0 && (
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{daysToClean === 1 ? t.tomorrow : t.inDays(daysToClean)}</div>
                )}
                {RESIDENTS.map(n => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f5f5", fontSize: 14 }}>
                    <span style={{ fontWeight: n === user ? 700 : 400 }}>{n}</span>
                    <span style={{ color: "#666" }}>{nextClean[n]}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{t.noCleaningThisWeek}</div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {nextClean ? `${t.nextCleaningOn}: ${nextClean.date} 2026 · ${t.inDays(daysToClean)}` : t.noCleaningPlanned}
                </div>
              </>
            )}
          </div>

          {/* Reminders */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t.quickReminders}</div>
            {[t.rem1, t.rem2, t.rem3].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", fontSize: 13, color: "#444" }}>
                <span>{["🌙","🚿","💡"][i]}</span><span>{r}</span>
              </div>
            ))}
          </div>
        </>}

        {/* RULES */}
        {activePage === "rules" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t.houseRules}</h2>
          <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>{t.hausordnung}</p>
          {HOUSE_RULES.map((r, i) => (
            <div key={i} onClick={() => setExpandedRule(expandedRule === i ? null : i)} style={{ ...cardStyle, cursor: "pointer", marginBottom: 8, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{lang === "en" ? r.en : r.de}</div>
                    <div style={{ fontSize: 12, color: "#bbb" }}>{lang === "en" ? r.de : r.en}</div>
                  </div>
                </div>
                <span style={{ color: "#ccc", fontSize: 18, fontWeight: 300 }}>{expandedRule === i ? "−" : "+"}</span>
              </div>
              {expandedRule === i && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                  {lang === "en" ? r.detail_en : r.detail_de}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* CLEANING */}
        {activePage === "cleaning" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t.cleaningSchedule}</h2>
          <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>{t.cleaningSub}</p>
          <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setCleanView("list")} style={btnStyle(cleanView === "list")}>{t.listView}</button>
            <button onClick={() => setCleanView("calendar")} style={btnStyle(cleanView === "calendar")}>{t.calendarView}</button>
          </div>

          {cleanView === "calendar" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <button onClick={() => setCleanCalMonth(m => Math.max(0, m-1))} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{lang === "en" ? MONTHS[cleanCalMonth] : MONTHS_DE[cleanCalMonth]} 2026</span>
                <button onClick={() => setCleanCalMonth(m => Math.min(11, m+1))} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>›</button>
              </div>
              <CalendarMonth year={2026} month={cleanCalMonth} trashData={[]} cleanData={CLEANING_ROTATION} lang={lang} user={user} />
              <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                {CLEANING_ROTATION.filter(r => r.day.getMonth() === cleanCalMonth).map((r, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.date} — <span style={{ color: "#16a34a" }}>{r[user]}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanView === "list" && CLEANING_ROTATION.map((row, i) => (
            <div key={i} style={{ ...cardStyle, marginBottom: 8, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpandedCleanRow(expandedCleanRow === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{row.date} 2026</span>
                <span style={{ color: "#ccc", fontSize: 18 }}>{expandedCleanRow === i ? "−" : "+"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {RESIDENTS.map(n => (
                  <span key={n} style={{ fontSize: 12, background: n === user ? "#1a1a1a" : "#f5f5f5", color: n === user ? "#fff" : "#666", borderRadius: 20, padding: "3px 10px", fontWeight: n === user ? 700 : 400 }}>{n}: {row[n]}</span>
                ))}
              </div>
              {expandedCleanRow === i && (
                <div style={{ marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
                  {RESIDENTS.map(n => (
                    <div key={n} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: n === user ? "#1a1a1a" : "#555" }}>{n} — {row[n]}</div>
                      {(CLEANING_TASKS[row[n]] || []).map((task, ti) => (
                        <div key={ti} style={{ fontSize: 12, color: "#888", padding: "2px 0 2px 10px" }}>☐ {task}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* TRASH */}
        {activePage === "trash" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t.trashDuty}</h2>
          <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>{t.trashSub}</p>
          <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setTrashView("list")} style={btnStyle(trashView === "list")}>{t.listView}</button>
            <button onClick={() => setTrashView("calendar")} style={btnStyle(trashView === "calendar")}>{t.calendarView}</button>
          </div>

          {trashView === "calendar" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <button onClick={() => setCalMonth(m => Math.max(0, m-1))} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{lang === "en" ? MONTHS[calMonth] : MONTHS_DE[calMonth]} 2026</span>
                <button onClick={() => setCalMonth(m => Math.min(11, m+1))} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>›</button>
              </div>
              <CalendarMonth year={2026} month={calMonth} trashData={TRASH_DUTY} cleanData={[]} lang={lang} user={user} />
              <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                {TRASH_DUTY.filter(td => td.startDay.getMonth() === calMonth || (td.startDay.getMonth() === calMonth - 1 && new Date(td.startDay.getTime() + 6*86400000).getMonth() === calMonth)).map((td, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{td.week}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{td.collections.join(" · ")}</div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: td.person === user ? "#1a1a1a" : "#aaa" }}>{td.person}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trashView === "list" && TRASH_DUTY.map((td, i) => {
            const isCurr = isInTrashWeek(td, today);
            return (
              <div key={i} style={{ ...cardStyle, marginBottom: 8, padding: "14px 18px", border: isCurr ? "2px solid #1a1a1a" : "2px solid transparent", position: "relative" }}>
                {isCurr && <span style={{ position: "absolute", top: 14, right: 14, background: "#1a1a1a", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>{t.thisWeek}</span>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>{td.week}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{td.person}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>{t.putOut}<br />{td.putOut}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {td.collections.map((c, ci) => <div key={ci} style={{ fontSize: 12, color: "#666" }}>• {c}</div>)}
                </div>
              </div>
            );
          })}
        </>}

        {/* WASTE */}
        {activePage === "waste" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.wasteGuide}</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {WASTE_GUIDE.map((w, i) => (
              <button key={i} onClick={() => setSelectedWaste(i)} style={{ padding: "10px 16px", borderRadius: 50, border: selectedWaste === i ? "2px solid #1a1a1a" : "2px solid #e5e5e5", background: selectedWaste === i ? "#1a1a1a" : "#fff", color: selectedWaste === i ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {w.emoji} {w.name}
              </button>
            ))}
          </div>
          {(() => {
            const w = WASTE_GUIDE[selectedWaste];
            return (
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{w.emoji} {w.name}</h3>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: w.color, display: "inline-block" }} />
                </div>
                <p style={{ color: "#aaa", fontSize: 12, marginBottom: 20 }}>{lang === "en" ? w.schedule_en : w.schedule_de}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{t.yesGoes}</div>
                    {(lang === "en" ? w.yes_en : w.yes_de).map((y, i) => <div key={i} style={{ fontSize: 12, color: "#444", padding: "3px 0", borderBottom: "1px solid #f5f5f5" }}>{y}</div>)}
                  </div>
                  <div>
                    <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{t.noGoes}</div>
                    {(lang === "en" ? w.no_en : w.no_de).map((n, i) => <div key={i} style={{ fontSize: 12, color: "#444", padding: "3px 0", borderBottom: "1px solid #f5f5f5" }}>{n}</div>)}
                  </div>
                </div>
              </div>
            );
          })()}
        </>}

        {/* LAWS */}
        {activePage === "laws" && <>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.germanlaws}</h2>
          {GERMAN_LAWS.map((l, i) => (
            <div key={i} onClick={() => setExpandedLaw(expandedLaw === i ? null : i)} style={{ ...cardStyle, cursor: "pointer", marginBottom: 8, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{l.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{lang === "en" ? l.title_en : l.title_de}</div>
                </div>
                <span style={{ color: "#ccc", fontSize: 18, fontWeight: 300 }}>{expandedLaw === i ? "−" : "+"}</span>
              </div>
              {expandedLaw === i && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                  {lang === "en" ? l.detail_en : l.detail_de}
                </div>
              )}
            </div>
          ))}
        </>}

      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #f0f0f0", display: "flex", padding: "8px 4px 12px", zIndex: 50 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setActivePage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
            <span style={{ fontSize: 18 }}>{n.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: activePage === n.id ? "#1a1a1a" : "#bbb" }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
