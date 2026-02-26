import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TEST_USERS = [
  {
    email: 'alice@test.readpartner.com',
    display_name: 'Αλίκη Παπαδοπούλου',
    degree: 'Πληροφορική',
    semester: 4,
    avatar_color: 'bg-pink-500',
  },
  {
    email: 'vasilis@test.readpartner.com',
    display_name: 'Βασίλης Κωνσταντίνου',
    degree: 'Ηλεκτρολόγων Μηχ.',
    semester: 6,
    avatar_color: 'bg-blue-600',
  },
  {
    email: 'maria@test.readpartner.com',
    display_name: 'Μαρία Γεωργίου',
    degree: 'Φαρμακευτική',
    semester: 3,
    avatar_color: 'bg-purple-500',
  },
  {
    email: 'nikos@test.readpartner.com',
    display_name: 'Νίκος Αλεξίου',
    degree: 'Πληροφορική',
    semester: 5,
    avatar_color: 'bg-emerald-500',
  },
  {
    email: 'eleni@test.readpartner.com',
    display_name: 'Ελένη Δημητρίου',
    degree: 'Χημικών Μηχ.',
    semester: 2,
    avatar_color: 'bg-amber-500',
  },
]

export async function GET() {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Please log in first, then visit this URL.' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set in .env.local' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const log: string[] = []

    // ──────────────────────────────────────────────
    // 1. Fetch existing subjects & venues
    // ──────────────────────────────────────────────
    const { data: subjects } = await admin.from('subjects').select('*').order('id').limit(15)
    const { data: venues } = await admin.from('venues').select('*').order('id').limit(5)

    if (!subjects?.length) {
      return NextResponse.json({
        error: 'No subjects found in database. Please run the seed SQL scripts (004_seed_data.sql) in Supabase SQL Editor first.',
      }, { status: 400 })
    }

    log.push(`Found ${subjects.length} subjects, ${venues?.length ?? 0} venues`)

    // ──────────────────────────────────────────────
    // 2. Create test users (idempotent)
    // ──────────────────────────────────────────────
    const testUserIds: string[] = []

    for (const tu of TEST_USERS) {
      // Try to find existing
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const existing = listData?.users?.find((u: any) => u.email === tu.email)

      let userId: string

      if (existing) {
        userId = existing.id
        log.push(`User ${tu.email} already exists (${userId})`)
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: tu.email,
          password: 'testpass123',
          email_confirm: true,
          user_metadata: {
            display_name: tu.display_name,
            degree: tu.degree,
            semester: tu.semester,
          },
        })

        if (error) {
          log.push(`Failed to create ${tu.email}: ${error.message}`)
          continue
        }

        userId = data.user.id
        log.push(`Created user ${tu.email} (${userId})`)
      }

      testUserIds.push(userId)

      // Ensure profile exists with avatar color
      await admin.from('profiles').upsert({
        id: userId,
        display_name: tu.display_name,
        degree: tu.degree,
        semester: tu.semester,
        avatar_color: tu.avatar_color,
        subjects: [],
      }, { onConflict: 'id' })
    }

    if (testUserIds.length === 0) {
      return NextResponse.json({ error: 'Could not create any test users', log }, { status: 500 })
    }

    // Also ensure current user's profile has an avatar color
    await admin.from('profiles').update({ avatar_color: 'bg-primary' }).eq('id', currentUser.id).is('avatar_color', null)

    const today = new Date().toISOString().split('T')[0]

    // ──────────────────────────────────────────────
    // 3. Create today's sessions for test users
    // ──────────────────────────────────────────────
    const durations = ['1h', '2h', '3h', '1.5h', '2.5h']

    for (let i = 0; i < testUserIds.length; i++) {
      const subjectId = subjects[i % subjects.length].id
      const venueId = venues && venues.length > 0 ? venues[i % venues.length].id : null

      // Delete old sessions for today first
      await admin.from('sessions').delete()
        .eq('user_id', testUserIds[i])
        .eq('planned_date', today)

      const { error } = await admin.from('sessions').insert({
        user_id: testUserIds[i],
        subject_id: subjectId,
        venue_id: venueId,
        duration: durations[i],
        planned_date: today,
      })

      if (!error) {
        log.push(`Created session for test user ${i + 1} (subject ${subjectId})`)
      }
    }

    // Also create a session for the current user
    const mySubjectId = subjects[0].id
    const myVenueId = venues?.[0]?.id ?? null

    await admin.from('sessions').delete()
      .eq('user_id', currentUser.id)
      .eq('planned_date', today)

    await admin.from('sessions').insert({
      user_id: currentUser.id,
      subject_id: mySubjectId,
      venue_id: myVenueId,
      duration: '2h',
      planned_date: today,
    })
    log.push(`Created session for you (subject ${mySubjectId})`)

    // ──────────────────────────────────────────────
    // 4. Create an accepted match (so you can test chat)
    // ──────────────────────────────────────────────
    const chatPartnerId = testUserIds[0] // Alice
    const chatSubjectId = subjects[0].id

    // Check if match already exists
    const { data: existingMatch } = await admin.from('matches')
      .select('id')
      .or(`and(user_a.eq.${currentUser.id},user_b.eq.${chatPartnerId}),and(user_a.eq.${chatPartnerId},user_b.eq.${currentUser.id})`)
      .limit(1)
      .single()

    let chatMatchId: string

    if (existingMatch) {
      chatMatchId = existingMatch.id
      await admin.from('matches').update({ status: 'accepted' }).eq('id', chatMatchId)
      log.push(`Existing match with Alice updated to accepted`)
    } else {
      const { data: matchData, error: matchError } = await admin.from('matches').insert({
        user_a: chatPartnerId,
        user_b: currentUser.id,
        subject_id: chatSubjectId,
        venue_id: myVenueId,
        status: 'accepted',
      }).select().single()

      if (matchError) {
        log.push(`Failed to create chat match: ${matchError.message}`)
        chatMatchId = ''
      } else {
        chatMatchId = matchData.id
        log.push(`Created accepted match with Alice for chat testing`)
      }
    }

    // Insert some messages in the chat
    if (chatMatchId) {
      const { count } = await admin.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', chatMatchId)

      if (!count || count === 0) {
        const msgs = [
          { match_id: chatMatchId, sender_id: null, text: 'Match confirmed! Start chatting.', is_system: true },
          { match_id: chatMatchId, sender_id: chatPartnerId, text: 'Γεια σου! Θα είμαι στο αναγνωστήριο στις 5. Εσύ;' },
          { match_id: chatMatchId, sender_id: chatPartnerId, text: 'Θα διαβάσω κεφάλαιο 3 και 4 σήμερα 📚' },
        ]

        for (const msg of msgs) {
          await admin.from('messages').insert(msg)
        }
        log.push(`Inserted ${msgs.length} messages in chat with Alice`)
      } else {
        log.push(`Chat already has ${count} messages, skipping`)
      }
    }

    // ──────────────────────────────────────────────
    // 5. Create a pending match (so swiping right triggers mutual match)
    // ──────────────────────────────────────────────
    if (testUserIds.length > 1) {
      const pendingPartnerId = testUserIds[1] // Vasilis

      const { data: existingPending } = await admin.from('matches')
        .select('id')
        .or(`and(user_a.eq.${pendingPartnerId},user_b.eq.${currentUser.id}),and(user_a.eq.${currentUser.id},user_b.eq.${pendingPartnerId})`)
        .limit(1)
        .single()

      if (!existingPending) {
        await admin.from('matches').insert({
          user_a: pendingPartnerId,
          user_b: currentUser.id,
          subject_id: subjects[1 % subjects.length].id,
          status: 'pending',
        })
        log.push(`Created pending match from Vasilis → you (swipe right on him to get a mutual match!)`)
      } else {
        log.push(`Pending match with Vasilis already exists`)
      }
    }

    // ──────────────────────────────────────────────
    // 6. Create notes from test users
    // ──────────────────────────────────────────────
    const noteData = [
      { title: 'Σημειώσεις Προγραμματισμού - Κεφ. 1-3', author_idx: 0, subject_idx: 0, likes: 12, downloads: 45 },
      { title: 'Κυκλώματα - Περίληψη Εξεταστικής', author_idx: 1, subject_idx: 1, likes: 8, downloads: 23 },
      { title: 'Φαρμακολογία - Βασικές Αρχές', author_idx: 2, subject_idx: 2, likes: 15, downloads: 67 },
      { title: 'Αλγόριθμοι & Δομές Δεδομένων', author_idx: 3, subject_idx: 0, likes: 20, downloads: 89 },
      { title: 'Χημεία - Εργαστηριακές Ασκήσεις', author_idx: 4, subject_idx: 3 % subjects.length, likes: 5, downloads: 12 },
      { title: 'Μαθηματικά ΙΙ - Ολοκληρώματα', author_idx: 0, subject_idx: 4 % subjects.length, likes: 18, downloads: 56 },
      { title: 'Βάσεις Δεδομένων - SQL Cheatsheet', author_idx: 3, subject_idx: 0, likes: 35, downloads: 120 },
      { title: 'Φυσική - Μηχανική Σωμάτων', author_idx: 1, subject_idx: 5 % subjects.length, likes: 9, downloads: 31 },
    ]

    const { count: existingNotes } = await admin.from('notes')
      .select('*', { count: 'exact', head: true })

    if (!existingNotes || existingNotes < 3) {
      for (const n of noteData) {
        if (testUserIds[n.author_idx]) {
          await admin.from('notes').insert({
            title: n.title,
            author_id: testUserIds[n.author_idx],
            subject_id: subjects[n.subject_idx]?.id ?? subjects[0].id,
            likes_count: n.likes,
            downloads_count: n.downloads,
          })
        }
      }
      log.push(`Created ${noteData.length} test notes`)
    } else {
      log.push(`Notes already seeded (${existingNotes} found)`)
    }

    // ──────────────────────────────────────────────
    // 7. Create occupancy reports for venues
    // ──────────────────────────────────────────────
    if (venues && venues.length > 0) {
      for (const v of venues) {
        const randomPct = Math.floor(Math.random() * 70) + 10
        await admin.from('occupancy_reports').insert({
          venue_id: v.id,
          user_id: testUserIds[0],
          occupancy_pct: randomPct,
        })

        // Update the venue's occupancy field too
        await admin.from('venues').update({ occupancy: randomPct }).eq('id', v.id)
      }
      log.push(`Created occupancy reports for ${venues.length} venues`)
    }

    // ──────────────────────────────────────────────
    // 8. Create study session history (for profile stats)
    // ──────────────────────────────────────────────
    const { count: existingSessions } = await admin.from('study_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)

    if (!existingSessions || existingSessions === 0) {
      const pastDates = [
        new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      ]

      const studyData = [
        { partner_idx: 0, subject_idx: 0, venue_idx: 0, date_idx: 0, hours: 2.5 },
        { partner_idx: 1, subject_idx: 1, venue_idx: 1, date_idx: 1, hours: 3.0 },
        { partner_idx: 2, subject_idx: 0, venue_idx: 0, date_idx: 2, hours: 1.5 },
        { partner_idx: 0, subject_idx: 2, venue_idx: 2, date_idx: 3, hours: 2.0 },
        { partner_idx: 3, subject_idx: 0, venue_idx: 0, date_idx: 4, hours: 4.0 },
        { partner_idx: 1, subject_idx: 1, venue_idx: 1, date_idx: 5, hours: 2.0 },
      ]

      for (const sd of studyData) {
        const partnerId = testUserIds[sd.partner_idx]
        if (!partnerId) continue

        await admin.from('study_sessions').insert({
          user_id: currentUser.id,
          partner_id: partnerId,
          subject_id: subjects[sd.subject_idx]?.id ?? subjects[0].id,
          venue_id: venues?.[sd.venue_idx % (venues?.length || 1)]?.id ?? null,
          date: pastDates[sd.date_idx],
          duration_hours: sd.hours,
        })
      }
      log.push(`Created ${studyData.length} study session history records for your profile`)
    } else {
      log.push(`Study sessions already exist (${existingSessions} found)`)
    }

    // ──────────────────────────────────────────────
    // 9. Create a coupon for current user
    // ──────────────────────────────────────────────
    const { count: existingCoupons } = await admin.from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)

    if (!existingCoupons || existingCoupons === 0) {
      const couponVenues = venues?.slice(0, 3) ?? []
      const couponData = [
        { discount: '10% έκπτωση στον καφέ', code: `RP-${Date.now()}-A` },
        { discount: '15% έκπτωση', code: `RP-${Date.now()}-B` },
        { discount: 'Δωρεάν ρόφημα', code: `RP-${Date.now()}-C` },
      ]

      for (let i = 0; i < couponData.length; i++) {
        const venueId = couponVenues[i % couponVenues.length]?.id
        if (!venueId) continue

        await admin.from('coupons').insert({
          user_id: currentUser.id,
          venue_id: venueId,
          discount: couponData[i].discount,
          code: couponData[i].code,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      }
      log.push(`Created ${couponData.length} coupons for you`)
    } else {
      log.push(`Coupons already exist (${existingCoupons} found)`)
    }

    // ──────────────────────────────────────────────
    // Done!
    // ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully! Go back to the app and explore all features.',
      your_user_id: currentUser.id,
      test_users_created: testUserIds.length,
      instructions: [
        '🔍 Partner tab: Complete the wizard → you will see 5 test users to swipe on',
        '💬 Chat tab: You already have a chat with Αλίκη (Alice) with messages',
        '👆 Swipe right on Βασίλης (Vasilis) → instant mutual match!',
        '📝 Notes tab: 8 notes from test users to browse',
        '🏛 Venues tab: Live occupancy data for all venues',
        '👤 Profile tab: Study stats, past partners, coupons, calendar all populated',
      ],
      log,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}
