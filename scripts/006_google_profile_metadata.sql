-- 006_google_profile_metadata.sql
-- Populate new Google-authenticated profiles from standard OAuth name metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, degree, semester)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'degree', ''),
    COALESCE((NEW.raw_user_meta_data->>'semester')::int, 1)
  );
  RETURN NEW;
END;
$$;
