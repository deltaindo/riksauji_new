# 🔑 Environment Variables - Quick Reference

## Problem Summary

**Error**: `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`

**Root Cause**: `.env.local` file is missing or has undefined environment variables

---

## ✅ Solution: 3 Steps

### Step 1: Create `.env.local`

At project root (next to `package.json`):

```bash
cp .env.local.example .env.local
```

### Step 2: Fill in 3 values from Supabase Dashboard

| Variable | From Supabase | Example |
|----------|---------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role secret | `eyJhbGc...` |

### Step 3: Restart Dev Server

```bash
npm run dev
```

✅ Error should disappear!

---

## 🔍 Where to Find Each Value

### NEXT_PUBLIC_SUPABASE_URL

1. Open https://supabase.com/dashboard
2. Click your project name
3. Click **Settings** (gear icon, bottom left)
4. Click **API** tab (top menu)
5. Copy **Project URL**
6. Paste into `.env.local`

### NEXT_PUBLIC_SUPABASE_ANON_KEY

1. Same page: Settings → API
2. Find section: **Project API keys**
3. Look for: **anon public** (first key)
4. Click copy icon
5. Paste into `.env.local`

### SUPABASE_SERVICE_ROLE_KEY

1. Same page: Settings → API
2. Find section: **Project API keys**
3. Look for: **service_role secret** (second key)
4. Click copy icon
5. Paste into `.env.local`

**⚠️ WARNING**: This is a secret key!
- Do NOT commit to Git
- Do NOT expose in browser
- Do NOT share with others

---

## 📋 .env.local Template

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_NAME="Sistem Manajemen Riksa Uji"
```

---

## 💎 Validation

After setup, you should see:

```
✅ Supabase client initialized
   URL: https://abc123.supabase.co
```

### If you see errors:

- [ ] Check `.env.local` exists in project root
- [ ] Check all 3 values are filled (no blanks)
- [ ] Check URL starts with `https://` (not `http://`)
- [ ] Check URL contains `.supabase.co`
- [ ] Restart dev server: `npm run dev`
- [ ] Clear browser cache: `Ctrl+Shift+Delete`

---

## 🔗 Related Files

- Main setup: `README.md`
- Detailed guide: `docs/SETUP_GUIDE.md`
- Database schema: `docs/database-schema.sql`
- Environment template: `.env.local.example`

---

**Once `.env.local` is set, run `npm run dev` and error disappears!** ✅
