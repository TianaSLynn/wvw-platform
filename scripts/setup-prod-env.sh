#!/usr/bin/env bash
# WVW Intelligence — Production Env Var Setup
# Run this script from the wvw-platform directory: bash scripts/setup-prod-env.sh

set -e

echo ""
echo "═══════════════════════════════════════════════════"
echo "  WVW Intelligence — Production Env Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── 1. Resend API Key ────────────────────────────────────────────────────────
echo "Step 1 of 4: Anthropic API Key (AI Command + Today's Brief)"
echo "  → Go to console.anthropic.com → API Keys → Create Key"
echo "  → Name: 'WVW Intelligence Production'"
echo ""
read -rsp "Paste your Anthropic API key (starts with sk-ant-): " ANTHROPIC_KEY
echo ""

if [[ -n "$ANTHROPIC_KEY" ]]; then
  echo "$ANTHROPIC_KEY" | npx vercel env add ANTHROPIC_API_KEY production
  echo "✓ ANTHROPIC_API_KEY added"
else
  echo "⚠ Skipped ANTHROPIC_API_KEY — AI Command will not work without this"
fi

echo ""

# ─── 2. Resend API Key ────────────────────────────────────────────────────────
echo "Step 2 of 4: Resend API Key (email delivery)"
echo "  → Go to resend.com → API Keys → Create API Key"
echo "  → Name: 'WVW Intelligence Production'"
echo ""
read -rsp "Paste your Resend API key (starts with re_): " RESEND_KEY
echo ""

if [[ -n "$RESEND_KEY" ]]; then
  echo "$RESEND_KEY" | npx vercel env add RESEND_API_KEY production
  echo "✓ RESEND_API_KEY added"
else
  echo "⚠ Skipped RESEND_API_KEY"
fi

echo ""

# ─── 2. Clerk Webhook Secret ──────────────────────────────────────────────────
echo "Step 3 of 4: Clerk Webhook Secret"
echo "  → Go to clerk.com → your app → Webhooks → Add Endpoint"
echo "  → URL: https://wvw-platform.vercel.app/api/webhooks/clerk"
echo "  → Events: user.created, user.updated, user.deleted, organization.created"
echo "  → Copy the Signing Secret (starts with whsec_)"
echo ""
read -rsp "Paste your Clerk Webhook Signing Secret: " CLERK_WH
echo ""

if [[ -n "$CLERK_WH" ]]; then
  echo "$CLERK_WH" | npx vercel env add CLERK_WEBHOOK_SECRET production
  echo "✓ CLERK_WEBHOOK_SECRET added"
else
  echo "⚠ Skipped CLERK_WEBHOOK_SECRET"
fi

echo ""

# ─── 3. Vercel Blob ───────────────────────────────────────────────────────────
echo "Step 4 of 4: Vercel Blob Storage (file uploads)"
echo "  → Go to vercel.com → wvw-platform project → Storage tab"
echo "  → Click Create → Blob Store → name it 'wvw-evidence'"
echo "  → The BLOB_READ_WRITE_TOKEN is auto-generated"
echo "  → Copy it from Storage → Connect → Environment Variables"
echo ""
read -rsp "Paste your Vercel Blob token (starts with vercel_blob_rw_): " BLOB_TOKEN
echo ""

if [[ -n "$BLOB_TOKEN" ]]; then
  echo "$BLOB_TOKEN" | npx vercel env add BLOB_READ_WRITE_TOKEN production
  echo "✓ BLOB_READ_WRITE_TOKEN added"
else
  echo "⚠ Skipped BLOB_READ_WRITE_TOKEN"
fi

echo ""

# ─── Verify Clerk key type ────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════"
echo "  IMPORTANT: Verify Clerk uses LIVE keys on Vercel"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Your local .env.local has TEST keys (pk_test_, sk_test_)."
echo "  These don't work on wvw-platform.vercel.app."
echo ""
echo "  To check/fix:"
echo "  1. clerk.com → your app → API Keys"
echo "  2. Switch toggle to 'Live' at the top"
echo "  3. Copy pk_live_... and sk_live_..."
echo "  4. Update in Vercel: npx vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production"
echo "     Then: npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production"
echo ""
read -rp "Does Vercel already have LIVE Clerk keys? (y/n): " HAS_LIVE

if [[ "$HAS_LIVE" != "y" ]]; then
  echo ""
  read -rsp "Paste your Clerk LIVE publishable key (pk_live_...): " PK_LIVE
  echo ""
  read -rsp "Paste your Clerk LIVE secret key (sk_live_...): " SK_LIVE
  echo ""

  if [[ -n "$PK_LIVE" && -n "$SK_LIVE" ]]; then
    npx vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production --yes 2>/dev/null || true
    npx vercel env rm CLERK_SECRET_KEY production --yes 2>/dev/null || true
    echo "$PK_LIVE" | npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
    echo "$SK_LIVE" | npx vercel env add CLERK_SECRET_KEY production
    echo "✓ Clerk LIVE keys updated"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  All done! Deploying to production now..."
echo "═══════════════════════════════════════════════════"
echo ""

npx vercel --prod

echo ""
echo "✓ Deployment triggered."
echo "  Visit: https://wvw-platform.vercel.app"
echo "  Admin status: https://wvw-platform.vercel.app/app-status"
echo ""
