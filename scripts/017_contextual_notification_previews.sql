-- Store a short, private preview for the transient in-app message banner.
-- The notification row remains visible only to its recipient through RLS.

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

  INSERT INTO public.notifications(user_id, type, actor_id, match_id, source_id, payload)
  VALUES (
    v_recipient,
    'message',
    NEW.sender_id,
    NEW.match_id,
    NEW.id,
    jsonb_build_object('message_preview', left(btrim(NEW.text), 160))
  )
  ON CONFLICT (user_id, type, source_id) DO NOTHING;
  RETURN NEW;
END;
$$;
