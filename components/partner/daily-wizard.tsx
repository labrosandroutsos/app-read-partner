"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronLeft, ChevronRight, Clock, MapPin, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const maxDate = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now])
  const [step, setStep] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(localDateValue(now))
  const [selectedTime, setSelectedTime] = useState("18:00")
  const [selectedDuration, setSelectedDuration] = useState("2h")
  const [selectedVenue, setSelectedVenue] = useState("anywhere")
  const [maxDistanceKm, setMaxDistanceKm] = useState(5)
  const [studyStyle, setStudyStyle] = useState("either")
  const [language, setLanguage] = useState("either")

  const subjectItems = subjects.map((subject) => ({ id: String(subject.id), name: subject.name, nameEn: subject.name_en }))
  const venueItems = venues.filter((venue) => venue.is_open)
  const canProceed = [
    Boolean(selectedSubject),
    Boolean(selectedDate && selectedTime && selectedDuration && new Date(`${selectedDate}T${selectedTime}:00`).getTime() > Date.now()),
    Boolean(selectedVenue && maxDistanceKm >= 0.5),
    Boolean(studyStyle && language),
  ][step]

  const handleNext = () => {
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((index) => <div key={index} className={cn("h-1.5 rounded-full transition-all", index === step ? "w-8 bg-primary" : index < step ? "w-4 bg-primary/40" : "w-4 bg-muted")} />)}
      </div>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><StepIcon className="h-6 w-6 text-primary" /></div>
        <h2 className="text-lg font-bold text-foreground">{titles[step]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("partner.wizard.step")} {step + 1} {t("partner.wizard.of")} 4</p>
      </div>

      {step === 0 && <div className="flex flex-wrap justify-center gap-2">{subjectItems.map((subject) => <Badge key={subject.id} variant={selectedSubject === subject.id ? "default" : "outline"} className="cursor-pointer px-3 py-2 text-sm" onClick={() => setSelectedSubject(subject.id)}>{el ? subject.name : subject.nameEn}</Badge>)}</div>}

      {step === 1 && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="match-date">{el ? "Ημερομηνία" : "Date"}</Label><Input id="match-date" type="date" min={localDateValue(now)} max={localDateValue(maxDate)} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="match-time">{el ? "Έναρξη" : "Start time"}</Label><Input id="match-time" type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>{el ? "Διάρκεια" : "Duration"}</Label><div className="grid grid-cols-3 gap-2">{["1h", "2h", "4h"].map((duration) => <Button key={duration} type="button" variant={selectedDuration === duration ? "default" : "outline"} onClick={() => setSelectedDuration(duration)}>{duration}</Button>)}</div></div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <Card className={cn("cursor-pointer", selectedVenue === "anywhere" && "border-primary bg-primary/5")} onClick={() => setSelectedVenue("anywhere")}><CardContent className="flex items-center gap-3 p-3"><MapPin className="h-5 w-5 text-primary" /><span className="font-medium text-sm">{t("partner.wizard.venue.anywhere")}</span></CardContent></Card>
          {venueItems.filter((venue) => venue.distance <= maxDistanceKm).map((venue) => <Card key={venue.id} className={cn("cursor-pointer", selectedVenue === venue.id && "border-primary bg-primary/5")} onClick={() => setSelectedVenue(venue.id)}><CardContent className="flex items-center gap-3 p-3"><MapPin className="h-5 w-5 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{venue.name}</p><p className="text-xs text-muted-foreground">{venue.distance} km</p></div>{venue.discount && <Badge variant="secondary">-{venue.discount}%</Badge>}</CardContent></Card>)}
          <div className="space-y-2 rounded-xl border p-3"><div className="flex justify-between text-sm"><Label htmlFor="match-distance">{el ? "Μέγιστη απόσταση" : "Maximum distance"}</Label><span>{maxDistanceKm} km</span></div><input id="match-distance" type="range" min="1" max="20" step="1" value={maxDistanceKm} onChange={(event) => setMaxDistanceKm(Number(event.target.value))} className="w-full accent-primary" /></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="space-y-2"><Label>{el ? "Στυλ μελέτης" : "Study style"}</Label><Select value={studyStyle} onValueChange={setStudyStyle}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="quiet">{el ? "Ήσυχη συγκέντρωση" : "Quiet focus"}</SelectItem><SelectItem value="social">{el ? "Συζήτηση και συνεργασία" : "Social and collaborative"}</SelectItem><SelectItem value="either">{el ? "Οποιοδήποτε" : "Either"}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>{el ? "Γλώσσα" : "Language"}</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="el">Ελληνικά</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="either">{el ? "Οποιαδήποτε" : "Either"}</SelectItem></SelectContent></Select></div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        {step > 0 && <Button variant="outline" onClick={() => setStep((current) => current - 1)} className="flex-1"><ChevronLeft className="mr-1 h-4 w-4" />{t("partner.wizard.back")}</Button>}
        <Button onClick={handleNext} disabled={!canProceed || isSubmitting} className="flex-1">{step === 3 && isSubmitting ? t("partner.search.loading") : step === 3 ? t("partner.wizard.find") : t("partner.wizard.next")}{step < 3 && <ChevronRight className="ml-1 h-4 w-4" />}</Button>
      </div>
    </div>
  )
}
