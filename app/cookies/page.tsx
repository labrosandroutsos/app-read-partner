import Link from "next/link"

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-10 text-sm leading-6">
      <Link href="/" className="text-primary hover:underline">← Read Partner</Link>
      <h1 className="mt-6 text-3xl font-bold">Cookie and Local Storage Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: 24 August 2026</p>

      <div className="mt-8 space-y-7">
        <section><h2 className="text-lg font-semibold">Essential storage</h2><p className="mt-2 text-muted-foreground">Supabase authentication uses first-party session cookies to keep users signed in and protect authenticated routes. Theme and language preferences may be stored locally. These functions are necessary to provide requested app features and are not disabled by rejecting analytics.</p></section>
        <section><h2 className="text-lg font-semibold">Privacy preference</h2><p className="mt-2 text-muted-foreground"><code>read-partner-privacy-v1</code> is stored in local storage to remember whether optional analytics was accepted or rejected. It contains the preference, policy version and decision time, not an advertising identifier.</p></section>
        <section><h2 className="text-lg font-semibold">Optional analytics</h2><p className="mt-2 text-muted-foreground">Vercel Web Analytics is loaded only after acceptance. It provides aggregate page and device statistics and does not use third-party advertising cookies. Read Partner does not send message contents, email addresses or profile names as analytics events.</p></section>
        <section><h2 className="text-lg font-semibold">Changing your choice</h2><p className="mt-2 text-muted-foreground">Select the persistent Privacy button in the application to accept or reject analytics again. Rejecting analytics removes the analytics component from the page and does not affect sign-in, chat, matching or other core functionality.</p></section>
      </div>
    </main>
  )
}
