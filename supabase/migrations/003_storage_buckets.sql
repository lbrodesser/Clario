-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('dokumente', 'dokumente', false, 52428800); -- 50MB

CREATE POLICY storage_kanzlei_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dokumente' AND auth.role() = 'authenticated'
  );

CREATE POLICY storage_portal_upload ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dokumente');

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);
