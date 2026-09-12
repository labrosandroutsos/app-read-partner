"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronLeft, ChevronRight, Clock, MapPin, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function DailyWizard({ onComplete, subjects = [], venues = [], isSubmitting = false }: DailyWizardProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const now = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => nextStudyStart(now), [now])
  const maxDate = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now])
  const [step, setStep] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(localDateValue(defaultStart))
  const [selectedTime, setSelectedTime] = useState(`${String(defaultStart.getHours()).padStart(2, "0")}:${String(defaultStart.getMinutes()).padStart(2, "0")}`)
  const [selectedDuration, setSelectedDuration] = useState("2h")
  const [selectedVenue, setSelectedVenue] = useState("anywhere")
  const [maxDistanceKm, setMaxDistanceKm] = useState(5)
  const [studyStyle, setStudyStyle] = useState("either")
  const [language, setLanguage] = useState("either")

  const subjectItems = subjects.map((subject) => ({ id: String(subject.id), name: subject.name, nameEn: subject.name_en }))
  const venueItems = venues.filter((venue) => venue.is_open)
  const validDate = isFutureStudyTime(selectedDate, selectedTime, localDateValue(maxDate))
  const canProceed = [
    Boolean(selectedSubject),
    validDate && Boolean(selectedDuration),
    Boolean(selectedVenue && maxDistanceKm >= 0.5),
    Boolean(studyStyle && language),
  ][step]

  const handleNext = () => {
    if (!canProceed || isSubmitting) return
    if (step === 3 && !validDate) { setStep(1); return }
    if (step < 3) return setStep((current) => current + 1)
    void onComplete({
      subject: selectedSubject,
      venue: selectedVenue,
      duration: selectedDuration,
      plannedStart: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
      studyStyle,
      language,
      maxDistanceKm,
    })
  }

  const titles = [t("partner.wizard.subject"), el ? "Ημερομηνία και ώρα" : "Date and time", t("partner.wizard.venue"), el ? "Προτιμήσεις μελέτης" : "Study preferences"]
  const StepIcon = [BookOpen, Clock, MapPin, SlidersHorizontal][step]

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-7">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{el ? "ΜΑΖΙ, ΠΙΟ ΕΥΚΟΛΑ" : "MAKE ROOM FOR FOCUS"}</p>
        <h1 className="study-title text-4xl leading-tight">{el ? "Πάμε για διάβασμα;" : "Your next study day."}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{el ? "Διάλεξε τι και πότε θέλεις να διαβάσεις. Αν το θέλετε και οι δύο, θα ανοίξει μια συνομιλία." : "Choose what and when you’d like to study. When you both want to connect, a chat opens."}</p>
      </div>
      <ol aria-label={el ? "Βήματα αναζήτησης" : "Search steps"} className="grid grid-cols-4 gap-2">
        {titles.map((title, index) => <li key={title} aria-current={index === step ? "step" : undefined} className="space-y-2"><div className={cn("h-1 rounded-full", index <= step ? "bg-primary" : "bg-border")} /><span className={cn("text-[11px] leading-tight", index === step ? "font-semibold text-primary" : "text-muted-foreground")}>{index + 1}. {title}</span></li>)}
      </ol>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10"><StepIcon className="h-5 w-5 text-primary" /></div>
        <h2 className="text-lg font-semibold text-foreground">{titles[step]}</h2>
      </div>
      {step === 0 && <div className="grid grid-cols-2 gap-2">{subjectItems.map((subject) => <button type="button" key={subject.id} aria-pressed={selectedSubject === subject.id} className={cn("min-h-14 rounded-xl border px-3 py-3 text-left text-sm transition-colors", selectedSubject === subject.id ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card hover:border-primary/50")} onClick={() => setSelectedSubject(subject.id)}>{el ? subject.name : subject.nameEn}</button>)}{subjectItems.length === 0 && <p role="status" className="col-span-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{el ? "Δεν υπάρχουν διαθέσιμα μαθήματα. Δοκίμασε ξανά αργότερα." : "No subjects are available yet. Please try again later."}</p>}</div>}

      {step === 1 && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="match-date">{el ? "Ημερομηνία" : "Date"}</Label><Input id="match-date" type="date" min={localDateValue(now)} max={localDateValue(maxDate)} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="match-time">{el ? "Έναρξη" : "Start time"}</Label><Input id="match-time" type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} /></div>
          </div>
          {!validDate && <p role="status" className="text-sm text-destructive">{el ? "Διάλεξε μελλοντική ώρα μέσα στις επόμενες 30 ημέρες." : "Choose a future time within the next 30 days."}</p>}
          <div className="space-y-2"><Label>{el ? "Διάρκεια" : "Duration"}</Label><div className="grid grid-cols-3 gap-2">{["1h", "2h", "4h"].map((duration) => <Button key={duration} type="button" variant={selectedDuration === duration ? "default" : "outline"} onClick={() => setSelectedDuration(duration)}>{duration}</Button>)}</div></div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <button type="button" aria-pressed={selectedVenue === "anywhere"} className={cn("rounded-xl border bg-card text-left transition-colors", selectedVenue === "anywhere" && "border-primary bg-primary/5")} onClick={() => setSelectedVenue("anywhere")}><span className="flex items-center gap-3 p-4"><MapPin className="h-5 w-5 text-primary" /><span className="font-medium text-sm">{t("partner.wizard.venue.anywhere")}</span></span></button>
          {venueItems.filter((venue) => venue.distance <= maxDistanceKm).map((venue) => <button type="button" aria-pressed={selectedVenue === venue.id} key={venue.id} className={cn("rounded-xl border bg-card text-left transition-colors", selectedVenue === venue.id && "border-primary bg-primary/5")} onClick={() => setSelectedVenue(venue.id)}><span className="flex items-center gap-3 p-4"><MapPin className="h-5 w-5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{venue.name}</span><span className="block text-xs text-muted-foreground">{venue.distance} km</span></span>{venue.discount && <Badge variant="secondary">-{venue.discount}%</Badge>}</span></button>)}
          <div className="space-y-2 rounded-xl border p-3"><div className="flex justify-between text-sm"><Label htmlFor="match-distance">{el ? "Μέγιστη απόσταση" : "Maximum distance"}</Label><span>{maxDistanceKm} km</span></div><input id="match-distance" type="range" min="1" max="20" step="1" value={maxDistanceKm} onChange={(event) => { const distance = Number(event.target.value); setMaxDistanceKm(distance); if (venueItems.some((venue) => venue.id === selectedVenue && venue.distance > distance)) setSelectedVenue("anywhere") }} className="w-full accent-primary" /></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="space-y-2"><Label htmlFor="study-style">{el ? "Στυλ μελέτης" : "Study style"}</Label><Select value={studyStyle} onValueChange={setStudyStyle}><SelectTrigger id="study-style"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="quiet">{el ? "Ήσυχη συγκέντρωση" : "Quiet focus"}</SelectItem><SelectItem value="social">{el ? "Συζήτηση και συνεργασία" : "Social and collaborative"}</SelectItem><SelectItem value="either">{el ? "Οποιοδήποτε" : "Either"}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="study-language">{el ? "Γλώσσα" : "Language"}</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger id="study-language"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="el">Ελληνικά</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="either">{el ? "Οποιαδήποτε" : "Either"}</SelectItem></SelectContent></Select></div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        {step > 0 && <Button variant="outline" disabled={isSubmitting} onClick={() => setStep((current) => current - 1)} className="h-12 flex-1"><ChevronLeft className="mr-1 h-4 w-4" />{t("partner.wizard.back")}</Button>}
        <Button onClick={handleNext} disabled={!canProceed || isSubmitting} className="h-12 flex-1">{step === 3 && isSubmitting ? t("partner.search.loading") : step === 3 ? t("partner.wizard.find") : t("partner.wizard.next")}{step < 3 && <ChevronRight className="ml-1 h-4 w-4" />}</Button>
      </div>
    </div>
  )
}
