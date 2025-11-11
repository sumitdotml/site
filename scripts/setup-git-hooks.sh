#!/bin/bash

# Setup git hooks for automatic localhost view cleanup
# Usage: ./scripts/setup-git-hooks.sh

HOOK_FILE=".git/hooks/pre-push"

echo "🔧 Setting up git pre-push hook..."

# Create pre-push hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Auto-cleanup localhost views before pushing
echo "🧹 Running pre-push cleanup..."

# Only run if wrangler is installed
if command -v wrangler &> /dev/null; then
    "$(dirname "$0")/../scripts/cleanup-localhost-views.sh"
else
    echo "⚠️  Wrangler not found, skipping view cleanup"
fi

exit 0
EOF

# Make hook executable
chmod +x "$HOOK_FILE"

echo "✅ Git hook installed at $HOOK_FILE"
echo ""
echo "Now when you run 'git push', localhost view counts will be automatically deleted!"
echo ""
echo "To manually clean up anytime, run:"
echo "  ./scripts/cleanup-localhost-views.sh"
