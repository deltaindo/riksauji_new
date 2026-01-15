# Riksa Uji - Aircraft Inspection Management System

MVP Phase 1: Document Management, Verification, and SPK Tracking

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/deltaindo/riksauji_new.git
cd riksauji_new
npm install
```

### 2. Configure Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase credentials (see section below).

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000/login in your browser.

---

## 🔑 Supabase Configuration

### Step 1: Get Your Supabase Project URL

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Go to **API** tab
5. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
6. Paste it as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Step 2: Get Your Anon Key

1. In the same **Settings → API** tab
2. Under **Project API keys**, find the **anon public** key
3. Click the copy icon next to it
4. Paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Step 3: Get Your Service Role Key

1. In the same **Settings → API** tab
2. Under **Project API keys**, find the **service_role secret** key
3. Click the copy icon next to it
4. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**⚠️ Important**: Keep the service role key SECRET. Never commit it to Git or expose it in the browser.

### Step 4: Create Storage Bucket

1. In Supabase dashboard, go to **Storage** (in left sidebar)
2. Click **Create a new bucket**
3. Name it: `documents`
4. Uncheck **Public bucket** (make it private)
5. Click **Create bucket**

### Step 5: Set Storage RLS Policies

Go to the **documents** bucket → **Policies** tab and add these policies:

**Policy 1: Marketing upload**
```sql
CREATE POLICY "Marketing upload own SPK docs" ON storage.objects
  FOR INSERT TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'marketing'
    )
  );
```

**Policy 2: Admin Dokumen view all**
```sql
CREATE POLICY "Admin Dokumen view all docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin_dokumen'
    )
  );
```

### Step 6: Initialize Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `docs/database-schema.sql`
4. Click **Run**

This creates all tables, indexes, and RLS policies.

---

## 🔧 Troubleshooting

### Error: "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"

**Solution:**
- Check that `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` set
- Verify it starts with `https://` and contains `.supabase.co`
- Restart dev server after updating `.env.local`

### Error: Missing environment variable

**Solution:**
1. Make sure `.env.local` exists (not `.env`)
2. Copy from `.env.local.example` if needed
3. Fill in all 3 required variables from Supabase dashboard
4. Restart dev server

### Can't login

**Solution:**
- Verify database schema is created (run SQL from `docs/database-schema.sql`)
- Create a test user in Supabase Auth (Dashboard → Authentication → Users)
- Create matching profile in `profiles` table:
  ```sql
  INSERT INTO profiles (user_id, email, nama_lengkap, role)
  VALUES ('{user-uuid}', '{user-email}', 'Test User', 'marketing');
  ```

### File upload fails

**Solution:**
- Verify `documents` storage bucket exists and is private
- Check RLS policies are set on the storage bucket
- Ensure user role is either `marketing` or `admin_dokumen`

---

## 📋 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) | `eyJhbGc...` |

### Optional

| Variable | Description | Default |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_NAME` | App display name | `Sistem Manajemen Riksa Uji` |
| `NODE_ENV` | Environment mode | `development` |

---

## 📁 Project Structure

```
riksauji_new/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Protected dashboard pages
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── lib/
│   │   └── supabase/          # Supabase clients
│   └── middleware.ts          # Auth middleware
├── .env.local                 # Environment variables (local)
├── .env.local.example         # Environment template
├── next.config.ts             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json
```

---

## 🔐 Security Notes

- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be public (exposed in browser)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` MUST be kept secret (server-side only)
- ✅ RLS (Row Level Security) policies restrict data access by role
- ✅ Storage policies restrict file access by role
- ✅ API routes verify user role before sensitive operations

---

## 📊 Database Schema Overview

### Main Tables

- **profiles**: User roles and metadata
- **clients**: Customer information
- **aircrafttypes**: Aircraft models with required document checklists
- **spks**: Service order (SPK) records
- **spkdocuments**: Uploaded documents with verification status
- **notifications**: User alerts and notifications

See `docs/database-schema.sql` for full schema.

---

## 🧪 Testing

### Manual Test Checklist

- [ ] App loads at http://localhost:3000/login
- [ ] Can login with test user
- [ ] Dashboard loads without errors
- [ ] Can create a new SPK
- [ ] Can upload documents to SPK
- [ ] Document checklist displays correctly
- [ ] Can submit SPK (status changes to submitted)
- [ ] Admin can verify documents
- [ ] Can generate WhatsApp reminder link

### Test User Setup

1. In Supabase dashboard, create user:
   - Email: `marketing@test.com`
   - Password: (set your own)

2. Create profile for user:
   ```sql
   INSERT INTO profiles (user_id, email, nama_lengkap, role)
   VALUES (
     '{the-uuid-from-auth-users}',
     'marketing@test.com',
     'Test Marketing',
     'marketing'
   );
   ```

---

## 🚢 Deployment

### Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

---

## 📚 References

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## 📝 License

Private project for Delta Indonesia

---

## 🤝 Support

For questions or issues, contact the development team.
