#!/bin/bash

# Script to delete all localhost view counts from Cloudflare KV
# Usage: ./scripts/cleanup-localhost-views.sh

echo "🧹 Cleaning up localhost view counts..."

cd "$(dirname "$0")/.." || exit 1
cd worker || exit 1

# Get all keys from KV and parse with grep/sed (no jq needed!)
keys=$(wrangler kv key list --binding=BLOG_VIEWS --preview false --remote 2>/dev/null | \
       grep -o '"name":"views:local-[^"]*"' | \
       sed 's/"name":"//g' | \
       sed 's/"//g')

if [ -z "$keys" ]; then
    echo "✨ No localhost view counts found. All clean!"
    exit 0
fi

count=0
while IFS= read -r key; do
    if [ -n "$key" ]; then
        echo "   Deleting: $key"
        wrangler kv key delete "$key" --binding=BLOG_VIEWS --preview false --remote 2>/dev/null
        ((count++))
    fi
done <<< "$keys"

echo "✅ Deleted $count localhost view count(s)"

