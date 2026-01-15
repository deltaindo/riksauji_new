# 🚀 Riksa Uji Setup Troubleshooting Guide

## Issue: "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"

**This error occurs when environment variables are missing or incomplete.**

---

## ✅ Quick Fix (5 minutes)

### Step 1: Create .env.local file

In your project root (next to `package.json`), create a file named `.env.local`:

```bash
cp .env.local.example .env.local
```

Or manually create `.env.local` with this content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_NAME="Sistem Manajemen Riksa Uji"
```

### Step 2: Get Supabase Credentials

Follow these exact steps:

#### 2a. Get Project URL

1. Open [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** from the list
3. Click the **⚙️ Settings** icon (bottom left of sidebar)
4. Click the **API** tab (top menu)
5. Find **Project URL** and click the **copy icon** 📋
6. Paste it into `.env.local` as:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<paste-here>
   ```
   Should look like: `https://abc123xyz.supabase.co`

#### 2b. Get Anon Key

1. Stay in **Settings → API** tab (same page)
2. Find **Project API keys** section
3. Look for **anon public** key
4. Click the **copy icon** 📋 next to it
5. Paste it into `.env.local` as:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-here>
   ```
   Should be a long string like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 2c. Get Service Role Key

1. Stay in **Settings → API** tab (same page)
2. In the same **Project API keys** section
3. Look for **service_role secret** key (below the anon key)
4. Click the **copy icon** 📋 next to it
5. Paste it into `.env.local` as:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<paste-here>
   ```
   Should be a long string like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**⚠️ IMPORTANT**: Keep this key SECRET!
- Never share it
- Never commit to Git
- Never expose in the browser

### Step 3: Save and Restart

1. Save the `.env.local` file
2. **Close your dev server** (Ctrl+C)
3. **Restart it**:
   ```bash
   npm run dev
   ```

✅ The error should disappear!

---

## 🔍 Verify Your Configuration

After setting up `.env.local`, you should see in console:

```
✅ Supabase client initialized
   URL: https://abc123xyz.supabase.co
```

If you see red `❌` errors instead, check that:
- All three values are filled in `.env.local`
- Values have no extra spaces or quotes
- URL starts with `https://` (not `http://`)
- URL ends with `.supabase.co`

---

## 🗂️ Complete .env.local Template

```env
# ============================================================
# SUPABASE CONFIGURATION (Required)
# ============================================================

# From Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# From Supabase Dashboard → Settings → API → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Supabase Dashboard → Settings → API → service_role secret
# ⚠️ KEEP THIS SECRET - Never commit to Git!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# APPLICATION CONFIGURATION (Optional)
# ============================================================
NEXT_PUBLIC_APP_NAME="Sistem Manajemen Riksa Uji"
NODE_ENV=development
```

---

## 🆘 Common Issues

### Issue 1: `.env.local` File Not Found

**Symptom**: Still getting errors after creating `.env.local`

**Solution**:
- Make sure file is named `.env.local` (NOT `.env` or `.env.local.txt`)
- File should be in project root, next to `package.json`
- On Windows, make sure extension is not hidden (show file extensions)
- Restart dev server after creating file

### Issue 2: "Your profile must be in the profiles table"

**Symptom**: Can login but get database error

**Solution**:
1. Create test user in Supabase:
   - Dashboard → Authentication → Users
   - Click "Create new user"
   - Email: `marketing@test.com`
   - Password: (set your own)

2. Get the user UUID from the list

3. Create profile record in SQL Editor:
   ```sql
   INSERT INTO profiles (user_id, email, nama_lengkap, role)
   VALUES (
     '{UUID-from-step-2}',
     'marketing@test.com',
     'Test Marketing User',
     'marketing'
   );
   ```

### Issue 3: Upload Files Not Working

**Symptom**: "Permission denied" when uploading documents

**Solution**:
1. Create storage bucket:
   - Dashboard → Storage (left sidebar)
   - Click "Create a new bucket"
   - Name: `documents`
   - Uncheck "Public bucket" (make private)
   - Click "Create bucket"

2. Add RLS policy (in bucket details → Policies):
   ```sql
   CREATE POLICY "Marketing upload" ON storage.objects
     FOR INSERT TO authenticated
     USING (
       bucket_id = 'documents' AND
       auth.uid() IN (
         SELECT user_id FROM profiles WHERE role = 'marketing'
       )
     );
   ```

### Issue 4: Port 3000 Already in Use

**Symptom**: "Error: Port 3000 is already in use"

**Solution**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill the process on port 3000
# On Mac/Linux:
lsof -i :3000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## ✅ Final Checklist

Before starting development:

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is filled and starts with `https://`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is filled
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is filled
- [ ] Dev server restarted after creating `.env.local`
- [ ] No red errors in console
- [ ] Can access http://localhost:3000/login
- [ ] Database schema created (run `docs/database-schema.sql`)
- [ ] Test user created in Supabase Auth
- [ ] Test profile created in profiles table
- [ ] Storage bucket `documents` created (private)
- [ ] Storage RLS policy added

---

## 📚 Next Steps

1. **Login**: Use your test user credentials
2. **Create SPK**: Click "Create SPK" button
3. **Upload Documents**: Add documents to the SPK
4. **Verify**: As admin_dokumen role, verify documents
5. **Submit**: Change status to submitted/verified

See main `README.md` for more information.

---

## 💬 Need Help?

If you're still getting errors:

1. Check console for the exact error message
2. Verify all env variables are set correctly
3. Try clearing browser cache (`Ctrl+Shift+Delete`)
4. Try restarting dev server
5. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

**Once `.env.local` is set correctly, run `npm run dev` and the error should disappear!** ✅
