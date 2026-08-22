"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the recovery email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            {sent ? <CheckCircle className="h-6 w-6 text-primary-foreground" /> : <BookOpen className="h-6 w-6 text-primary-foreground" />}
          </div>
          <CardTitle className="text-2xl font-bold">{sent ? "Check your email" : "Reset your password"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {sent
              ? "If an account exists for that email, you will receive a secure recovery link."
              : "Enter the email address connected to your Read Partner account."}
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setSent(false)}>Send another link</Button>
              <Button asChild><Link href="/auth/login">Back to login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}
              <div className="flex flex-col gap-2">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.gr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Sending..." : "Send recovery link"}
              </Button>
              <Button variant="ghost" asChild><Link href="/auth/login">Back to login</Link></Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
