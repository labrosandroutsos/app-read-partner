"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setAuthorized(Boolean(data.user))
      setChecking(false)
    })
  }, [supabase.auth])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    if (password !== confirmation) {
      setError("The passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      await supabase.auth.signOut({ scope: "local" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{success ? "Password updated" : "Choose a new password"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {success ? "Your password has been changed. Sign in again with the new password." : "Your new password must contain at least 8 characters."}
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <Button className="w-full" asChild><Link href="/auth/login">Continue to login</Link></Button>
          ) : !authorized ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm text-muted-foreground">This recovery link is invalid or has expired. Request a new link.</p>
              <Button asChild><Link href="/auth/forgot-password">Request another link</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
