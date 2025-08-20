# Supadrive Pro — Shareable Collections

This patch adds:
- Collections (groups of files)
- Move/Add files to a collection
- Create a public share link (slug) that opens `/s/[slug]` with a promotional banner (title/subtitle/image/CTA)
- Grid view with thumbnails, search, multi-select, and share selected

## Install
```bash
npm i jszip file-saver
npm i -D @types/file-saver
```

## Database (Supabase)
Run the SQL migration in your Supabase SQL editor:
```
supabase/migrations/2025-08-14_collections_shares.sql
```

## ENV
Set:
```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Usage
- Select files in Dashboard → "مشاركة المحدد" → a collection and public share are created automatically, and the link is copied.
- Or click "مجموعة" to create/select a collection, then share it with a custom banner via DB fields.

> The bucket `drive` should be public for thumbnail URLs to work, or update code to use signed URLs.
