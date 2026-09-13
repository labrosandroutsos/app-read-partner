"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  function networkHint(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err)
    const name = err instanceof Error ? err.name : ""
    if (
      name === "TypeError" ||
      msg.includes("fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Failed to fetch")
    ) {
      return "We couldn’t connect. Check your internet connection and try again in a moment."
    }
    return msg || "Something went wrong."
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push("/app")
      }
    } catch (err) {
      setError(networkHint(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setOauthLoading(true)
    setError("")
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      })
      if (error) {
        setError(error.message)
        setOauthLoading(false)
      }
    } catch (err) {
      setError(networkHint(err))
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-dvh grid items-center gap-6 bg-background px-5 py-7 lg:grid-cols-2 lg:gap-20 lg:px-[max(3rem,calc((100vw-1120px)/2))]">
      <section className="mx-auto w-full max-w-lg">
        <div className="mb-5 flex items-center gap-3 text-sm font-semibold tracking-wide"><BookOpen className="h-6 w-6 text-primary" /> READ PARTNER</div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Good study days<br />start together.</h1>
        <p className="mt-4 max-w-sm text-base leading-7 text-muted-foreground">Find someone studying what you are. Make a plan, share your notes, and turn “I’ll do it later” into a little progress.</p>
        <ol className="mt-9 hidden space-y-4 text-sm lg:block">
          {["Choose a subject and a time that suits you", "Connect when you both want to study together", "Chat and agree on your study session"].map((text, i) => <li key={text} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary">{i + 1}</span>{text}</li>)}
        </ol>
      </section>
      <Card className="mx-auto w-full max-w-[440px] border-border py-5 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to find your study partner</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div role="alert" className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" autoComplete="email" type="email" placeholder="you@university.gr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" autoComplete="current-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="h-12 w-full" disabled={loading || oauthLoading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <Button variant="outline" className="h-12 w-full" onClick={handleGoogleLogin} disabled={oauthLoading || loading}>
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            {oauthLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <a href="/auth/sign-up" className="text-primary font-medium hover:underline">Sign up</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
