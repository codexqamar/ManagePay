-- Migration to create a public storage bucket for company logos

-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

-- 2. Allow public access to read logos
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'company-logos' );

-- 3. Allow authenticated users to upload their own logos
-- Note: We use the owner column which is usually the user's UUID
create policy "Authenticated users can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
  );

-- 4. Allow users to update/delete their own logos
create policy "Users can update own logos"
  on storage.objects for update
  using ( bucket_id = 'company-logos' AND auth.uid() = owner );

create policy "Users can delete own logos"
  on storage.objects for delete
  using ( bucket_id = 'company-logos' AND auth.uid() = owner );
