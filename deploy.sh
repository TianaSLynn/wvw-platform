#!/bin/bash
# WVW Intelligence — one-shot deploy script
# Run this AFTER: vercel login + git remote add origin <your-repo-url>

set -e

VERCEL="./node_modules/.bin/vercel"
ENV_FILE=".env.local"

echo ""
echo "▶ WVW Intelligence — Deploy Script"
echo "──────────────────────────────────"

# 1. Check vercel auth
echo "Checking Vercel auth..."
$VERCEL whoami || { echo "❌ Not logged in. Run: ./node_modules/.bin/vercel login"; exit 1; }

# 2. Link or create vercel project
echo ""
echo "Linking Vercel project..."
$VERCEL link --yes 2>/dev/null || $VERCEL --yes 2>/dev/null

# 3. Push all env vars from .env.local
echo ""
echo "Adding environment variables..."
while IFS='=' read -r key rest; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  # Reconstruct value (handles = signs in values)
  val="${rest}"
  # Strip surrounding quotes if present
  val="${val%\"}"
  val="${val#\"}"
  if [[ -n "$val" ]]; then
    echo "  → $key"
    printf '%s' "$val" | $VERCEL env add "$key" production --force 2>/dev/null || true
    printf '%s' "$val" | $VERCEL env add "$key" preview --force 2>/dev/null || true
  fi
done < "$ENV_FILE"

# 4. Override APP_URL after deployment (gets updated below)
echo ""
echo "Deploying to production..."
DEPLOY_URL=$($VERCEL --prod --yes 2>&1 | grep "https://" | tail -1)

echo ""
echo "✅ Deployed!"
echo "   URL: $DEPLOY_URL"
echo ""
echo "──────────────────────────────────"
echo "Next steps:"
echo "1. Add BLOB_READ_WRITE_TOKEN if not set (Vercel Dashboard → Storage → Blob)"
echo "2. Update NEXT_PUBLIC_APP_URL to: $DEPLOY_URL"
echo "3. Add your production domain to Clerk Dashboard → Domains"
echo "4. Run: $VERCEL env add NEXT_PUBLIC_APP_URL production"
echo "   Then paste: $DEPLOY_URL"
echo "5. Redeploy: $VERCEL --prod --yes"
