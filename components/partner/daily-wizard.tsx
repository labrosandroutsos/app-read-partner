"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, ChevronLeft, MapPin, Search, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { nextStudyStart, isFutureStudyTime } from "@/lib/study-time"
import { cn } from "@/lib/utils"
import type { Subject, Venue } from "@/lib/types"

export interface MatchPreferences {
  subject: string
  venue: string
  duration: string
  plannedStart: string
  studyStyle: string
  language: string
  maxDistanceKm: number
}

interface DailyWizardProps {
  onComplete: (prefs: MatchPreferences) => void | Promise<void>
  subjects?: Subject[]
  venues?: Venue[]
  isSubmitting?: boolean
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function DailyWizard({ onComplete, subjects = [], venues = [], isSubmitting = false }: DailyWizardProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const now = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => nextStudyStart(now), [now])
  const maxDate = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now])
  const [step, setStep] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [subjectQuery, setSubjectQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(localDateValue(defaultStart))
  const [selectedTime, setSelectedTime] = useState(`${String(defaultStart.getHours()).padStart(2, "0")}:${String(defaultStart.getMinutes()).padStart(2, "0")}`)
  const [selectedDuration, setSelectedDuration] = useState("2h")
  const [selectedVenue, setSelectedVenue] = useState("anywhere")
  const [maxDistanceKm, setMaxDistanceKm] = useState(5)
  const [studyStyle, setStudyStyle] = useState("either")
  const [language, setLanguage] = useState("either")
  const [showPreferences, setShowPreferences] = useState(false)
  const venueItems = venues.filter((venue) => venue.is_open)
  const subjectName = (subject: Subject) => el ? subject.name : subject.name_en
  const chosenSubject = subjects.find((subject) => String(subject.id) === selectedSubject)
  const visibleSubjects = subjects.filter((subject) => `${subject.name} ${subject.name_en}`.toLocaleLowerCase(locale).includes(subjectQuery.toLocaleLowerCase(locale).trim()))
  const validDate = isFutureStudyTime(selectedDate, selectedTime, localDateValue(maxDate))
  const canProceed = [Boolean(selectedSubject), validDate && Boolean(selectedDuration), Boolean(selectedVenue && studyStyle && language)][step]
  const stepLabels = el ? ["Μάθημα", "Ώρα", "Τοποθεσία"] : ["Subject", "Time", "Place"]
  const headings = el ? ["Τι θα διαβάσεις;", "Πότε σε βολεύει;", "Πού θα βρεθείτε;"] : ["What are you studying?", "When works for you?", "Where will you meet?"]
  const descriptions = el
    ? ["Βρες παρέα για το επόμενο διάβασμά σου.", "Διάλεξε ώρα και διάρκεια για το διάβασμά σου.", "Διάλεξε χώρο ή αποφασίστε μαζί στη συνομιλία."]
    : ["Find a little company for your next study session.", "Pick a start time and how long you’d like to study.", "Choose a place, or decide together in the chat."]

  const handleNext = () => {
    if (!canProceed || isSubmitting) return
    if (step < 2) { setStep(step + 1); return }
    if (!isFutureStudyTime(selectedDate, selectedTime, localDateValue(maxDate))) { setStep(1); return }
    void onComplete({ subject: selectedSubject, venue: selectedVenue, duration: selectedDuration,
      plannedStart: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(), studyStyle, language, maxDistanceKm })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-5">
      <ol aria-label={el ? "Βήματα αναζήτησης" : "Search steps"} className="mb-6 flex items-center gap-2">
        {stepLabels.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-2">
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
              {index < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("text-xs", index === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="mb-6" aria-live="polite" aria-atomic="true">
        <h1 className="study-title text-[30px] leading-tight text-foreground">{headings[step]}</h1>
        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{descriptions[step]}</p>
      </div>

      <fieldset disabled={isSubmitting} className="min-w-0 flex-1">
        <legend className="sr-only">{headings[step]}</legend>
        {step === 0 && (
          <div>
            {subjects.length > 8 && <div className="relative mb-4"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className="h-12 pl-10" aria-label={el ? "Αναζήτηση μαθήματος" : "Search subjects"} placeholder={el ? "Αναζήτηση μαθήματος" : "Search subjects"} value={subjectQuery} onChange={(event) => setSubjectQuery(event.target.value)} /></div>}
            <div className="grid grid-cols-2 gap-3">
              {visibleSubjects.map((subject) => {
                const selected = selectedSubject === String(subject.id)
                const hue = (Number(subject.id) * 47) % 360
                const label = subjectName(subject)
                return <label key={subject.id} className={cn("relative flex min-h-[60px] cursor-pointer items-center gap-2 rounded-2xl border bg-card px-2.5 py-2.5 shadow-sm transition-all duration-150 ease-[var(--ease-out-quint)] active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", selected ? "border-primary bg-primary/[0.06] font-semibold shadow-md" : "border-border hover:border-primary/40")}>
                  <input className="sr-only" type="radio" name="study-subject" value={subject.id} checked={selected} onChange={() => setSelectedSubject(String(subject.id))} />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: `oklch(0.92 0.05 ${hue})`, color: `oklch(0.42 0.12 ${hue})` }} aria-hidden="true">{label.charAt(0)}</span>
                  <span className="min-w-0 flex-1 pr-3 text-[13.5px] leading-tight hyphens-auto">{label}</span>
                  {selected && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true"><Check className="h-2.5 w-2.5" /></span>}
                </label>
              })}
            </div>
            {visibleSubjects.length === 0 && <p role="status" className="py-6 text-sm text-muted-foreground">{subjects.length === 0 ? (el ? "Δεν υπάρχουν διαθέσιμα μαθήματα. Δοκίμασε αργότερα." : "No subjects are available yet. Try again later.") : (el ? "Δεν βρέθηκε μάθημα. Δοκίμασε άλλη αναζήτηση." : "No subjects found. Try another search.")}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <p className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-primary" aria-hidden="true" />{chosenSubject && subjectName(chosenSubject)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-2"><Label htmlFor="match-date">{el ? "Ημερομηνία" : "Date"}</Label><Input className="h-12 min-w-0 bg-card" id="match-date" type="date" min={localDateValue(now)} max={localDateValue(maxDate)} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
              <div className="min-w-0 space-y-2"><Label htmlFor="match-time">{el ? "Έναρξη" : "Start time"}</Label><Input className="h-12 min-w-0 bg-card" id="match-time" type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} /></div>
            </div>
            {!validDate && <p role="status" className="text-sm text-destructive">{el ? "Διάλεξε μελλοντική ώρα μέσα στις επόμενες 30 ημέρες." : "Choose a future time within the next 30 days."}</p>}
            <fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium">{el ? "Για πόση ώρα;" : "How long?"}</legend><div className="grid grid-cols-3 gap-2">{["1h", "2h", "4h"].map((duration) => <Button key={duration} type="button" aria-pressed={selectedDuration === duration} variant={selectedDuration === duration ? "default" : "outline"} className="h-12" onClick={() => setSelectedDuration(duration)}>{duration[0]} {el ? (duration === "1h" ? "ώρα" : "ώρες") : (duration === "1h" ? "hour" : "hours")}</Button>)}</div></fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {[{ id: "anywhere", name: el ? "Αποφασίζουμε μαζί" : "Decide together" }, ...venueItems.filter((venue) => venue.distance <= maxDistanceKm)].map((venue) => <label key={venue.id} className="flex min-h-16 cursor-pointer items-center gap-3 px-4 py-3 focus-within:bg-secondary">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="flex-1 text-sm font-medium">{venue.name}</span>
                <input className="h-5 w-5 accent-primary" type="radio" name="study-venue" value={venue.id} checked={selectedVenue === venue.id} onChange={() => setSelectedVenue(venue.id)} />
              </label>)}
            </div>
            <button type="button" aria-expanded={showPreferences} aria-controls="matching-preferences" className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium text-primary" onClick={() => setShowPreferences(!showPreferences)}><SlidersHorizontal className="h-4 w-4" />{el ? "Προτιμήσεις αναζήτησης" : "Search preferences"}<span className="ml-auto text-xs">{showPreferences ? (el ? "Κλείσιμο" : "Hide") : (el ? "Αλλαγή" : "Edit")}</span></button>
            {!showPreferences && <p className="-mt-3 text-xs leading-5 text-muted-foreground">{el ? "Γλώσσα, τρόπος μελέτης και φίλτρο απόστασης." : "Language, study style, and distance filter."}</p>}
            <div id="matching-preferences" hidden={!showPreferences} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="study-style">{el ? "Τρόπος μελέτης" : "Study style"}</Label><Select value={studyStyle} onValueChange={setStudyStyle}><SelectTrigger id="study-style" className="data-[size=default]:h-12 w-full bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="quiet">{el ? "Ήσυχη συγκέντρωση" : "Quiet focus"}</SelectItem><SelectItem value="social">{el ? "Συζήτηση και συνεργασία" : "Social and collaborative"}</SelectItem><SelectItem value="either">{el ? "Χωρίς προτίμηση" : "No preference"}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="study-language">{el ? "Γλώσσα" : "Language"}</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger id="study-language" className="data-[size=default]:h-12 w-full bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="el">Ελληνικά</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="either">{el ? "Χωρίς προτίμηση" : "No preference"}</SelectItem></SelectContent></Select></div>
              <div><div className="flex justify-between text-sm"><Label htmlFor="match-distance">{el ? "Φίλτρο απόστασης" : "Distance filter"}</Label><span>{maxDistanceKm} km</span></div><input id="match-distance" type="range" min="1" max="20" step="1" value={maxDistanceKm} onChange={(event) => { const distance = Number(event.target.value); setMaxDistanceKm(distance); if (venueItems.some((venue) => venue.id === selectedVenue && venue.distance > distance)) setSelectedVenue("anywhere") }} className="h-11 w-full accent-primary" /></div>
            </div>
            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">{el ? "Η συνομιλία ανοίγει μόνο όταν επιλέξετε ο ένας τον άλλο." : "A chat opens only when you both choose to connect."}</p>
          </div>
        )}
      </fieldset>

      <div className="sticky bottom-0 mt-6 flex items-center gap-3 bg-background py-4">
        {step > 0 && <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setStep(step - 1)} className="h-12 px-4"><ChevronLeft className="h-4 w-4" />{t("partner.wizard.back")}</Button>}
        <Button type="button" onClick={handleNext} disabled={!canProceed || isSubmitting} className="h-12 flex-1">{isSubmitting ? t("partner.search.loading") : step === 2 ? (el ? "Βρες παρέα" : "Find a partner") : (el ? "Συνέχεια" : "Continue")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
      </div>
    </div>
  )
}
