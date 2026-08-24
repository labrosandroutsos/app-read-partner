-- Platform-neutral notification inbox for matches, messages, and study proposals.
-- Structured events are localized by clients and can later feed APNs or other
-- delivery channels without changing the underlying event model.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('match', 'message', 'schedule_proposal')),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  source_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, source_id)
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION private.notify_match_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NEW.status <> 'accepted'
     OR (TG_OP = 'UPDATE' AND OLD.status = 'accepted') THEN
    RETURN NEW;
  END IF;

  IF v_actor IS NULL OR v_actor <> NEW.user_a THEN
    INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
    VALUES (
      NEW.user_a,
      'match',
      NEW.user_b,
      NEW.id,
      NEW.id,
      jsonb_strip_nulls(jsonb_build_object('subject_id', NEW.subject_id, 'venue_id', NEW.venue_id))
    )
    ON CONFLICT (user_id, type, source_id) DO NOTHING;
  END IF;

  IF v_actor IS NULL OR v_actor <> NEW.user_b THEN
    INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
    VALUES (
      NEW.user_b,
      'match',
      NEW.user_a,
      NEW.id,
      NEW.id,
      jsonb_strip_nulls(jsonb_build_object('subject_id', NEW.subject_id, 'venue_id', NEW.venue_id))
    )
    ON CONFLICT (user_id, type, source_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_match_notifications ON public.matches;
CREATE TRIGGER create_match_notifications
AFTER INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION private.notify_match_participants();

CREATE OR REPLACE FUNCTION private.notify_message_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_recipient uuid;
BEGIN
  IF NEW.is_system OR NEW.sender_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = NEW.match_id AND status = 'accepted';
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_recipient := CASE
    WHEN v_match.user_a = NEW.sender_id THEN v_match.user_b
    WHEN v_match.user_b = NEW.sender_id THEN v_match.user_a
    ELSE NULL
  END;
  IF v_recipient IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id)
  VALUES (v_recipient, 'message', NEW.sender_id, NEW.match_id, NEW.id)
  ON CONFLICT (user_id, type, source_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_message_notification ON public.messages;
CREATE TRIGGER create_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION private.notify_message_recipient();

CREATE OR REPLACE FUNCTION private.notify_schedule_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recipient uuid;
BEGIN
  IF NEW.status <> 'proposed' OR NEW.proposed_by IS NULL OR NEW.match_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient := CASE
    WHEN NEW.user_id = NEW.proposed_by THEN NEW.partner_id
    WHEN NEW.partner_id = NEW.proposed_by THEN NEW.user_id
    ELSE NULL
  END;
  IF v_recipient IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
  VALUES (
    v_recipient,
    'schedule_proposal',
    NEW.proposed_by,
    NEW.match_id,
    NEW.id,
    jsonb_strip_nulls(jsonb_build_object(
      'starts_at', NEW.starts_at,
      'ends_at', NEW.ends_at,
      'venue_id', NEW.venue_id
    ))
  )
  ON CONFLICT (user_id, type, source_id)
  DO UPDATE SET
    actor_id = EXCLUDED.actor_id,
    match_id = EXCLUDED.match_id,
    payload = EXCLUDED.payload,
    read_at = NULL,
    created_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_schedule_notification ON public.study_sessions;
CREATE TRIGGER create_schedule_notification
AFTER INSERT OR UPDATE OF status, proposed_by, starts_at, ends_at, venue_id
ON public.study_sessions
FOR EACH ROW
WHEN (NEW.status = 'proposed')
EXECUTE FUNCTION private.notify_schedule_recipient();

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_updated integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF private.is_current_user_suspended() THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF private.can_moderate() OR private.is_venue_manager(v_user) THEN
    RAISE EXCEPTION 'Student account required';
  END IF;

  UPDATE public.notifications
  SET read_at = COALESCE(read_at, now())
  WHERE user_id = v_user
    AND read_at IS NULL
    AND (p_notification_id IS NULL OR id = p_notification_id);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notifications_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid) TO authenticated;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'notifications'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END;
$$;
