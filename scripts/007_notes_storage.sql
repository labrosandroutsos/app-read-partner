-- Private storage for uploaded notes. Run once in the Supabase SQL editor.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes',
  'notes',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can read note files" ON storage.objects;
CREATE POLICY "Authenticated users can read note files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notes');

DROP POLICY IF EXISTS "Users can upload their own note files" ON storage.objects;
CREATE POLICY "Users can upload their own note files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'notes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own note files" ON storage.objects;
CREATE POLICY "Users can delete their own note files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'notes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE OR REPLACE FUNCTION public.register_note_download(p_note_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notes
  SET downloads_count = downloads_count + 1
  WHERE id = p_note_id
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.register_note_download(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_note_download(uuid) TO authenticated;
