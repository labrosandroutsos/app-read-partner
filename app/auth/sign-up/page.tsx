"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [degree, setDegree] = useState("")
  const [semester, setSemester] = useState("1")
  const [loading, setLoading] = useState(false)
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
      return "Cannot reach Supabase (network error). In Supabase: Settings → API, copy the current Project URL and anon/public key into .env.local as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart npm run dev. If the project was paused, restore it from the dashboard."
    }
    return msg || "Something went wrong."
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            degree,
            semester: parseInt(semester),
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/auth/sign-up-success")
      }
    } catch (err) {
      setError(networkHint(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">Join Read Partner and study together</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" placeholder="Αντώνης Δ." value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.gr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="degree">Degree</Label>
                <Input id="degree" placeholder="π.χ. Πληροφορική" value={degree} onChange={(e) => setDegree(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" type="number" min="1" max="12" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary font-medium hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
