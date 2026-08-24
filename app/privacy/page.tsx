import Link from "next/link"

const privacyContact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-10 text-sm leading-6">
      <Link href="/" className="text-primary hover:underline">← Read Partner</Link>
      <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: 24 August 2026</p>

      <div className="mt-8 space-y-7">
        <PolicySection title="Who controls the data">
          <p>The operator of the deployed Read Partner service is the data controller. Privacy requests can be sent to {privacyContact ? <a className="text-primary underline" href={`mailto:${privacyContact}`}>{privacyContact}</a> : "the administrator identified by the university or venue operating this deployment"}.</p>
        </PolicySection>
        <PolicySection title="Data we process">
          <p>Account identifiers and authentication sessions; profile and study preferences; matches, messages and schedules; notes and note activity; venue check-ins; safety reports and blocks; and the minimum technical information required to operate and secure the service.</p>
        </PolicySection>
        <PolicySection title="Why we process it">
          <p>We process account and collaboration data to provide the service requested by users, protect users and prevent abuse. Optional aggregate analytics is processed only after consent and can be disabled at any time through Privacy preferences.</p>
        </PolicySection>
        <PolicySection title="Who can see it">
          <p>Messages and matches are limited to their participants. Venue managers receive anonymized operational statistics for their assigned venue. Signed-in students can see community notes and the limited profile information needed for matching. Safety information is restricted to the reporting user and authorized administrators.</p>
        </PolicySection>
        <PolicySection title="Service providers and transfers">
          <p>Supabase provides authentication, database, storage and realtime services. If accepted, Vercel provides aggregate web analytics. The production operator must maintain appropriate processor agreements and document any international-transfer safeguards that apply to its deployment.</p>
        </PolicySection>
        <PolicySection title="Retention and your rights">
          <p>Data must be retained only for as long as needed for the stated purpose and applicable safety or legal requirements. Users may request access, correction, export, restriction or deletion from the controller. Consent for analytics may be withdrawn at any time without affecting account functionality.</p>
        </PolicySection>
        <PolicySection title="Security">
          <p>Read Partner uses Supabase authentication, row-level database policies, private note storage and role-restricted database functions. No online service can guarantee absolute security; suspected incidents should be reported promptly to the service operator.</p>
        </PolicySection>
      </div>
      <p className="mt-10 text-xs text-muted-foreground">This policy must be reviewed with the final controller identity, retention schedule and deployment contracts before public launch.</p>
    </main>
  )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-semibold">{title}</h2><div className="mt-2 text-muted-foreground">{children}</div></section>
}
