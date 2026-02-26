"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, MapPin, Clock, BookOpen } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Subject, Venue } from "@/lib/types"

interface DailyWizardProps {
  onComplete: (prefs: { subject: string; venue: string; duration: string }) => void
  subjects?: Subject[]
  venues?: Venue[]
}

export function DailyWizard({ onComplete, subjects: propSubjects, venues: propVenues }: DailyWizardProps) {
  const { t, locale } = useTranslation()
  const [step, setStep] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedVenue, setSelectedVenue] = useState("")
  const [selectedDuration, setSelectedDuration] = useState("")

  // Use prop data if available
  const subjectItems = propSubjects && propSubjects.length > 0
    ? propSubjects.map(s => ({ id: s.id.toString(), name: s.name, nameEn: s.name_en }))
    : []

  const venueItems = propVenues && propVenues.length > 0
    ? propVenues.filter(v => v.is_open).map(v => ({
        id: v.id, name: v.name, address: v.address || '', discount: v.discount
      }))
    : []

  const canProceed =
    (step === 0 && selectedSubject) ||
    (step === 1 && selectedVenue) ||
    (step === 2 && selectedDuration)

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      onComplete({
        subject: selectedSubject,
        venue: selectedVenue,
        duration: selectedDuration,
      })
    }
  }

  const stepIcons = [BookOpen, MapPin, Clock]
  const StepIcon = stepIcons[step]

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
            )}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <StepIcon className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {step === 0 && t("partner.wizard.subject")}
          {step === 1 && t("partner.wizard.venue")}
          {step === 2 && t("partner.wizard.time")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("partner.wizard.step")} {step + 1} {t("partner.wizard.of")} 3
        </p>
      </div>

      {step === 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {subjectItems.map((sub) => (
            <Badge
              key={sub.id}
              variant={selectedSubject === sub.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer py-2 px-3 text-sm transition-all",
                selectedSubject === sub.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              )}
              onClick={() => setSelectedSubject(sub.id)}
            >
              {locale === "el" ? sub.name : sub.nameEn}
            </Badge>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-2">
          <Card
            className={cn(
              "cursor-pointer transition-all",
              selectedVenue === "anywhere"
                ? "border-primary bg-primary/5 shadow-sm"
                : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedVenue("anywhere")}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("partner.wizard.venue.anywhere")}</span>
            </CardContent>
          </Card>
          {venueItems.map((v) => (
            <Card
              key={v.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedVenue === v.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedVenue(v.id)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.address}</p>
                </div>
                {v.discount && (
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-xs shrink-0">
                    -{v.discount}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          {[
            { key: "1h", label: t("partner.wizard.time.1h"), icon: "1-2h" },
            { key: "2h", label: t("partner.wizard.time.2h"), icon: "2-4h" },
            { key: "4h", label: t("partner.wizard.time.4h"), icon: "4+h" },
          ].map((opt) => (
            <Card
              key={opt.key}
              className={cn(
                "cursor-pointer transition-all",
                selectedDuration === opt.key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedDuration(opt.key)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm",
                  selectedDuration === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {opt.icon}
                </div>
                <span className="font-medium">{opt.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("partner.wizard.back")}
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1"
        >
          {step === 2 ? t("partner.wizard.find") : t("partner.wizard.next")}
          {step < 2 && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}
