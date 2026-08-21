"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type Locale = "el" | "en"

const translations = {
  el: {
    // App
    "app.name": "Read Partner",
    "app.tagline": "Βρες τον ιδανικό συνάδελφο μελέτης",

    // Tabs
    "tab.partner": "Partner",
    "tab.chat": "Chat",
    "tab.notes": "Notes",
    "tab.venues": "Χώροι",
    "tab.profile": "Προφίλ",

    // Partner screen
    "partner.title": "Βρες Partner",
    "partner.subtitle": "Ρύθμισε τις προτιμήσεις σου",
    "partner.wizard.subject": "Μάθημα",
    "partner.wizard.subject.placeholder": "Επίλεξε μάθημα...",
    "partner.wizard.venue": "Τοποθεσία",
    "partner.wizard.venue.placeholder": "Επίλεξε χώρο...",
    "partner.wizard.venue.anywhere": "Οπουδήποτε κοντά",
    "partner.wizard.time": "Διάρκεια",
    "partner.wizard.time.1h": "1-2 ώρες",
    "partner.wizard.time.2h": "2-4 ώρες",
    "partner.wizard.time.4h": "4+ ώρες",
    "partner.wizard.find": "Βρες Partners",
    "partner.wizard.step": "Βήμα",
    "partner.wizard.of": "από",
    "partner.wizard.next": "Επόμενο",
    "partner.wizard.back": "Πίσω",
    "partner.search.loading": "Αναζήτηση...",
    "partner.search.error": "Δεν ήταν δυνατή η αναζήτηση. Δοκίμασε ξανά.",
    "partner.swipe.error": "Δεν ήταν δυνατή η καταχώριση. Δοκίμασε ξανά.",
    "partner.card.semester": "Εξάμηνο",
    "partner.card.km": "χλμ",
    "partner.card.overlap": "Χρονική επικάλυψη",
    "partner.match": "Ταίριασμα!",
    "partner.match.subtitle": "Ξεκινήστε να μελετάτε μαζί",
    "partner.match.chat": "Πήγαινε στο Chat",
    "partner.match.continue": "Συνέχισε αναζήτηση",
    "partner.nomore": "Δεν υπάρχουν άλλοι partners",
    "partner.nomore.subtitle": "Δοκίμασε ξανά αργότερα ή άλλαξε κριτήρια",
    "partner.restart": "Νέα αναζήτηση",

    // Chat screen
    "chat.title": "Συνομιλίες",
    "chat.empty": "Δεν υπάρχουν συνομιλίες ακόμα",
    "chat.empty.subtitle": "Βρες έναν partner για να ξεκινήσεις!",
    "chat.input.placeholder": "Γράψε μήνυμα...",
    "chat.quick.onmyway": "Έρχομαι!",
    "chat.quick.late": "Θα αργήσω",
    "chat.quick.arrived": "Έφτασα!",
    "chat.quick.done": "Τελειώσαμε!",
    "chat.session.started": "Η συνεδρία ξεκίνησε",
    "chat.session.ended": "Η συνεδρία τελείωσε",
    "chat.match.confirmed": "Έγινε match! Ξεκινήστε τη συνομιλία.",
    "chat.send.error": "Το μήνυμα δεν στάλθηκε. Δοκίμασε ξανά.",

    // Notes screen
    "notes.title": "Σημειώσεις",
    "notes.filter": "Φίλτρο μαθήματος",
    "notes.filter.all": "Όλα",
    "notes.upload": "Ανέβασε",
    "notes.upload.title": "Ανέβασμα σημειώσεων",
    "notes.upload.name": "Τίτλος",
    "notes.upload.name.placeholder": "Τίτλος σημειώσεων...",
    "notes.upload.subject": "Μάθημα",
    "notes.upload.file": "Αρχείο",
    "notes.upload.file.placeholder": "Επίλεξε αρχείο PDF ή εικόνα",
    "notes.upload.submit": "Ανέβασμα",
    "notes.upload.success": "Οι σημειώσεις ανέβηκαν επιτυχώς!",
    "notes.likes": "Likes",
    "notes.downloads": "Downloads",

    // Venues screen
    "venues.title": "Χώροι Μελέτης",
    "venues.list": "Λίστα",
    "venues.map": "Χάρτης",
    "venues.occupancy": "Πληρότητα",
    "venues.checkin": "Check in",
    "venues.discount": "Έκπτωση",
    "venues.open": "Ανοιχτό",
    "venues.closed": "Κλειστό",
    "venues.map.placeholder": "Ο χάρτης θα είναι διαθέσιμος σύντομα",

    // Profile screen
    "profile.title": "Προφίλ",
    "profile.edit": "Επεξεργασία",
    "profile.stats": "Στατιστικά Μελέτης",
    "profile.stats.hours": "ώρες",
    "profile.stats.total": "Σύνολο ωρών",
    "profile.partners": "Partners Μελέτης",
    "profile.partners.sessions": "συνεδρίες",
    "profile.coupons": "Τα Κουπόνια μου",
    "profile.coupons.expires": "Λήγει",
    "profile.coupons.qr": "QR Code",
    "profile.calendar": "Ημερολόγιο",
    "profile.calendar.upcoming": "Επερχόμενες συνεδρίες",
    "profile.settings": "Ρυθμίσεις",
    "profile.settings.language": "Γλώσσα",
    "profile.settings.theme": "Θέμα",
    "profile.settings.theme.light": "Φωτεινό",
    "profile.settings.theme.dark": "Σκοτεινό",
    "profile.settings.theme.system": "Σύστημα",
    "profile.settings.logout": "Αποσύνδεση",
    "profile.settings.about": "Σχετικά",
  },
  en: {
    // App
    "app.name": "Read Partner",
    "app.tagline": "Find your ideal study partner",

    // Tabs
    "tab.partner": "Partner",
    "tab.chat": "Chat",
    "tab.notes": "Notes",
    "tab.venues": "Venues",
    "tab.profile": "Profile",

    // Partner screen
    "partner.title": "Find Partner",
    "partner.subtitle": "Set your preferences",
    "partner.wizard.subject": "Subject",
    "partner.wizard.subject.placeholder": "Select subject...",
    "partner.wizard.venue": "Location",
    "partner.wizard.venue.placeholder": "Select venue...",
    "partner.wizard.venue.anywhere": "Anywhere nearby",
    "partner.wizard.time": "Duration",
    "partner.wizard.time.1h": "1-2 hours",
    "partner.wizard.time.2h": "2-4 hours",
    "partner.wizard.time.4h": "4+ hours",
    "partner.wizard.find": "Find Partners",
    "partner.wizard.step": "Step",
    "partner.wizard.of": "of",
    "partner.wizard.next": "Next",
    "partner.wizard.back": "Back",
    "partner.search.loading": "Searching...",
    "partner.search.error": "We couldn't start the search. Please try again.",
    "partner.swipe.error": "We couldn't save that swipe. Please try again.",
    "partner.card.semester": "Semester",
    "partner.card.km": "km",
    "partner.card.overlap": "Time overlap",
    "partner.match": "It's a Match!",
    "partner.match.subtitle": "Start studying together",
    "partner.match.chat": "Go to Chat",
    "partner.match.continue": "Continue searching",
    "partner.nomore": "No more partners",
    "partner.nomore.subtitle": "Try again later or change criteria",
    "partner.restart": "New search",

    // Chat screen
    "chat.title": "Conversations",
    "chat.empty": "No conversations yet",
    "chat.empty.subtitle": "Find a partner to get started!",
    "chat.input.placeholder": "Type a message...",
    "chat.quick.onmyway": "On my way!",
    "chat.quick.late": "Running late",
    "chat.quick.arrived": "I'm here!",
    "chat.quick.done": "We're done!",
    "chat.session.started": "Session started",
    "chat.session.ended": "Session ended",
    "chat.match.confirmed": "It's a match! Start the conversation.",
    "chat.send.error": "Your message wasn't sent. Please try again.",

    // Notes screen
    "notes.title": "Notes",
    "notes.filter": "Filter by subject",
    "notes.filter.all": "All",
    "notes.upload": "Upload",
    "notes.upload.title": "Upload Notes",
    "notes.upload.name": "Title",
    "notes.upload.name.placeholder": "Note title...",
    "notes.upload.subject": "Subject",
    "notes.upload.file": "File",
    "notes.upload.file.placeholder": "Select a PDF or image file",
    "notes.upload.submit": "Upload",
    "notes.upload.success": "Notes uploaded successfully!",
    "notes.likes": "Likes",
    "notes.downloads": "Downloads",

    // Venues screen
    "venues.title": "Study Venues",
    "venues.list": "List",
    "venues.map": "Map",
    "venues.occupancy": "Occupancy",
    "venues.checkin": "Check in",
    "venues.discount": "Discount",
    "venues.open": "Open",
    "venues.closed": "Closed",
    "venues.map.placeholder": "Map will be available soon",

    // Profile screen
    "profile.title": "Profile",
    "profile.edit": "Edit",
    "profile.stats": "Study Stats",
    "profile.stats.hours": "hours",
    "profile.stats.total": "Total hours",
    "profile.partners": "Study Partners",
    "profile.partners.sessions": "sessions",
    "profile.coupons": "My Coupons",
    "profile.coupons.expires": "Expires",
    "profile.coupons.qr": "QR Code",
    "profile.calendar": "Calendar",
    "profile.calendar.upcoming": "Upcoming sessions",
    "profile.settings": "Settings",
    "profile.settings.language": "Language",
    "profile.settings.theme": "Theme",
    "profile.settings.theme.light": "Light",
    "profile.settings.theme.dark": "Dark",
    "profile.settings.theme.system": "System",
    "profile.settings.logout": "Log out",
    "profile.settings.about": "About",
  },
} as const

type TranslationKey = keyof typeof translations.el

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("el")

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}
