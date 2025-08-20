# Supadrive (Next.js + Supabase Storage)

"كوكل درايف" مبسّط بواجهة عربية مبني على **Next.js 14** و**Supabase**.
- تسجيل دخول باستخدام Magic Link (OTP).
- مجلدات/ملفات، رفع، إعادة تسمية، حذف، تنزيل، ومشاركة عبر Signed URL.
- التخزين يتم في **Supabase Storage** داخل حاوية (Bucket) خاصة باسم `drive`.
- كل مستخدم يرى ملفاته داخل مسار خاص: `userId/...`

> **ملاحظة**: هذا القالب يستعمل Storage مباشرة لإدارة الملفات والمجلدات. بإمكانك لاحقاً إضافة قاعدة بيانات للجداول (ملفات/مجلدات) إن أردت ميزات متقدمة (بحث/وسوم/صلاحيات أدق).

---

## الإعداد السريع

1) **أنشئ مشروع Supabase** ثم:
   - من صفحة Storage أنشئ Bucket باسم: `drive` واجعله **Private**.
   - من Authentication فعّل Login عبر **Email (OTP)**.

2) **سياسات Storage (RLS) للمسارات الخاصة بالمستخدم:**
   افتح SQL Editor في Supabase ثم نفّذ:

```sql
-- اسم الباكيت: drive (خاص)
-- سياسة: السماح للمستخدم بقراءة/كتابة مسارات تبدأ بمعرّفه
-- (يُنشئ جدول "objects" إن لم يكن موجوداً ويضيف السياسات)

-- القراءة
create policy "read own files"
on storage.objects for select
to authenticated
using (bucket_id = 'drive' and (position((auth.uid())::text in name) = 1));

-- الكتابة (insert)
create policy "upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'drive'
  and (position((auth.uid())::text in new.name) = 1)
);

-- التعديل/النقل (update)
create policy "update own files"
on storage.objects for update
to authenticated
using (bucket_id = 'drive' and (position((auth.uid())::text in name) = 1))
with check (bucket_id = 'drive' and (position((auth.uid())::text in new.name) = 1));

-- الحذف
create policy "delete own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'drive' and (position((auth.uid())::text in name) = 1));
```

> **مهم**: نحن نعتمد أن كل مسار يبدأ بـ `auth.uid()` مثل `USER_ID/folder/file.ext`.
> إذا أردت نمطاً آخر للمسارات استخدم **storage.foldername** أو دوال Regex أدق.

3) **جهّز متغيرات البيئة** بإنشاء ملف `.env.local` في جذر المشروع من المثال:
```
NEXT_PUBLIC_SUPABASE_URL=...      # من إعدادات مشروع Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # اختياري (في حال أردت استخدامه على السيرفر)
```

4) **التشغيل محلياً**:
```bash
npm install
npm run dev
# افتح http://localhost:3000
```

---

## الميزات

- **مجلدات**: يُنشأ المجلد برفع ملف فارغ لمسار ينتهي بشرطة مائلة `/` (حل عملي لعدم وجود mkdir).
- **إعادة التسمية/النقل**: عبر `supabase.storage.move(from, to)`.
- **مشاركة**: إنشاء رابط موقّع بصلاحية زمنية.
- **حماية**: بفضل سياسات Storage، لا يستطيع المستخدم الوصول إلا لمساره.

### أين أحفظ البيانات الوصفية؟
إن احتجت لجدول ملفات/مجلدات متقدّم للبحث أو الوسوم، أضف الجداول التالية (اختياري):

```sql
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  path text not null,
  created_at timestamp with time zone default now()
);
alter table public.folders enable row level security;
create policy "folders_owner" on public.folders
for all to authenticated
using (owner = auth.uid()) with check (owner = auth.uid());

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  size bigint,
  mimetype text,
  folder_path text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.files enable row level security;
create policy "files_owner" on public.files
for all to authenticated
using (owner = auth.uid()) with check (owner = auth.uid());
```

ثم عدّل الواجهة لتزامن Storage ↔️ Database بحسب حاجتك.

---

## بنية المشروع

```
supadrive/
  app/
    api/sign-url/route.ts
    login/page.tsx
    ui/Dashboard.tsx
    layout.tsx
    page.tsx
    globals.css
  components/
    Breadcrumbs.tsx
    FileRow.tsx
    NavBar.tsx
  lib/
    supabaseClient.ts
    supabaseServer.ts
  .env.local.example
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
  README.md
```

---

## أفكار تطوير لاحقة

- مشاركة مع مستخدمين محدّدين وصلاحيات (قراءة/كتابة).
- رفع مجلد كامل وProgress Bar.
- البحث والفلاتر والوسوم.
- المعاينات الغنيّة (صور/ PDF داخل Modal).
- حدود التخزين وحصص المستخدمين.
- النسخ الاحتياطي وإصدارات الملفات.
