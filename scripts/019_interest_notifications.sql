-- Notify the recipient of a one-sided match interest without revealing the
-- sender's identity before the interest becomes mutual.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('interest', 'match', 'message', 'schedule_proposal'));

CREATE OR REPLACE FUNCTION private.notify_interest_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status <> 'pending'
     OR (TG_OP = 'UPDATE' AND OLD.status = 'pending') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
  VALUES (
    NEW.user_b,
    'interest',
    NULL,
    NULL,
    NEW.id,
    jsonb_strip_nulls(jsonb_build_object('subject_id', NEW.subject_id))
  )
  ON CONFLICT (user_id, type, source_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_interest_notifications ON public.matches;
CREATE TRIGGER create_interest_notifications
AFTER INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION private.notify_interest_recipient();

CREATE OR REPLACE FUNCTION private.resolve_interest_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = COALESCE(read_at, now())
  WHERE user_id = NEW.user_b
    AND type = 'interest'
    AND source_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resolve_interest_notifications ON public.matches;
CREATE TRIGGER resolve_interest_notifications
AFTER UPDATE OF status ON public.matches
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
EXECUTE FUNCTION private.resolve_interest_notification();

-- Recover currently pending interests created before this notification type.
INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
SELECT
  pending_match.user_b,
  'interest',
  NULL,
  NULL,
  pending_match.id,
  jsonb_strip_nulls(jsonb_build_object('subject_id', pending_match.subject_id))
FROM public.matches pending_match
JOIN public.sessions sender_search ON sender_search.id = pending_match.session_a
JOIN public.sessions recipient_search ON recipient_search.id = pending_match.session_b
WHERE pending_match.status = 'pending'
  AND sender_search.status = 'active'
  AND recipient_search.status = 'active'
  AND sender_search.expires_at > now()
  AND recipient_search.expires_at > now()
ON CONFLICT (user_id, type, source_id) DO NOTHING;

-- Old pending swipes can remain in test databases after their searches expire.
-- Keep their audit rows, but do not surface them as new interest.
UPDATE public.notifications interest_notification
SET read_at = COALESCE(interest_notification.read_at, now())
WHERE interest_notification.type = 'interest'
  AND NOT EXISTS (
    SELECT 1
    FROM public.matches pending_match
    JOIN public.sessions sender_search ON sender_search.id = pending_match.session_a
    JOIN public.sessions recipient_search ON recipient_search.id = pending_match.session_b
    WHERE pending_match.id = interest_notification.source_id
      AND pending_match.status = 'pending'
      AND sender_search.status = 'active'
      AND recipient_search.status = 'active'
      AND sender_search.expires_at > now()
      AND recipient_search.expires_at > now()
  );

REVOKE ALL ON FUNCTION private.notify_interest_recipient() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.resolve_interest_notification() FROM PUBLIC, anon, authenticated;
