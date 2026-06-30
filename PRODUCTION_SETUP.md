# WVW Intelligence — Production Launch Checklist

## ⚠️ Critical: Clerk Keys Must Be Switched

Your `.env.local` currently uses **Clerk TEST keys** (`pk_test_`, `sk_test_`).
Test keys only work on `localhost`. Vercel needs **LIVE keys**.

**To get live keys:**
1. Go to [clerk.com](https://clerk.com) → your app → **API Keys**
2. Switch the toggle from "Test" → "Live" at the top
3. Copy the `pk_live_...` and `sk_live_...` values

---

## Vercel Environment Variables to Set

Go to **Vercel Dashboard → wvw-platform → Settings → Environment Variables**

Add ALL of the following (select "Production + Preview + Development" for each unless noted):

### 🔴 Required (app will not work without these)

| Variable | Where to get it | Example value |
|----------|-----------------|---------------|
| `NEXT_PUBLIC_APP_URL` | Your production domain | `https://wvw-platform.vercel.app` |
| `DATABASE_URL` | Copy from your `.env.local` | `postgresql://neondb_owner:...` |
| `DIRECT_URL` | Copy from your `.env.local` | `postgresql://neondb_owner:...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys (LIVE) | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys (LIVE) | `sk_live_...` |
| `ANTHROPIC_API_KEY` | Copy from your `.env.local` | `sk-ant-api03-...` |
| `ENCRYPTION_KEY` | Copy from your `.env.local` | `24ee5be...` |

### 🟡 Required for email to work (Resend — you already have an account)

| Variable | Where to get it | Example value |
|----------|-----------------|---------------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys → Create key | `re_...` |
| `EMAIL_FROM` | Must be a verified Resend sender domain | `noreply@wvwconsulting.com` |

**To get your Resend API key:**
1. Go to resend.com → Sign in
2. Click **API Keys** in the left sidebar
3. Click **Create API Key** → name it "WVW Intelligence Production"
4. Copy the `re_...` key (shown once only)
5. Also verify `wvwconsulting.com` under **Domains** if not already done

### 🟡 Required for file uploads to work (Vercel Blob)

| Variable | Where to get it |
|----------|-----------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → your project → **Storage** tab → **Create Blob Store** → copy the token |

**Steps:**
1. In Vercel Dashboard, go to your `wvw-platform` project
2. Click **Storage** in the top nav
3. Click **Create** → select **Blob**
4. Name it `wvw-evidence-vault`
5. The token will be auto-added as `BLOB_READ_WRITE_TOKEN` to your project env vars

### 🟡 Required for user sync to work (Clerk Webhook)

| Variable | Where to get it |
|----------|-----------------|
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → **Webhooks** → Create endpoint → Signing Secret |

**Steps:**
1. Go to Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://wvw-platform.vercel.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`, `organization.created`
4. Copy the **Signing Secret** (starts with `whsec_`)

### ⚪ Clerk redirect URLs (add these too)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |
| `NEXT_PUBLIC_APP_NAME` | `WVW Intelligence` |

### ⚪ Optional (automation — add when ready)

| Variable | Where to get it |
|----------|-----------------|
| `N8N_API_KEY` | Your n8n instance → Settings → API |
| `N8N_API_URL` | Your n8n cloud/self-hosted URL |
| `NEXT_PUBLIC_N8N_URL` | Same as N8N_API_URL |

---

## After Adding All Env Vars

1. **Redeploy**: In Vercel Dashboard → Deployments → click the latest → **Redeploy**
2. **Test signup**: Go to `https://wvw-platform.vercel.app` → click Get Started → create an account
3. **Verify email**: You should receive a Clerk invite/confirmation email
4. **Check `/app-status`**: Log in and go to `/app-status` to see the live status board

---

## Also: Switch Clerk to Production Mode

In Clerk Dashboard:
1. Go to your app → **Configure** → **Restrictions**
2. Enable **Email + password** and any other sign-in methods you want
3. Under **Paths**, confirm the redirect URLs match your production domain
4. Set your production domain in **Domains** → Add `wvw-platform.vercel.app`

---

## Estimated Time to Complete This

| Task | Time |
|------|------|
| Switch Clerk to live keys + add to Vercel | 5 min |
| Copy all existing env vars to Vercel | 10 min |
| Get Resend API key + verify domain | 10 min |
| Enable Vercel Blob storage | 5 min |
| Set up Clerk webhook | 10 min |
| Redeploy + test | 15 min |
| **Total** | **~55 minutes** |
