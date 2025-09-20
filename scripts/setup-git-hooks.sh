#!/bin/bash

# Script to set up git hooks for the project
# Run this script after cloning the repository

echo "🔧 Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Pre-push hook to run build check before pushing
# This ensures the build passes before code is pushed to the repository

echo "🔍 Running pre-push checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "❌ Error: Not in a Node.js project directory" $RED
    exit 1
fi

# Run TypeScript type checking
print_status "🔍 Running TypeScript type check..." $YELLOW
if npm run typecheck > /dev/null 2>&1; then
    print_status "✅ TypeScript type check passed" $GREEN
else
    print_status "❌ TypeScript type check failed" $RED
    print_status "Run 'npm run typecheck' to see the errors" $YELLOW
    exit 1
fi

# Run build
print_status "🏗️  Running production build..." $YELLOW
if npm run build > /dev/null 2>&1; then
    print_status "✅ Production build successful" $GREEN
else
    print_status "❌ Production build failed" $RED
    print_status "Run 'npm run build' to see the errors" $YELLOW
    exit 1
fi

# Run linting
print_status "🧹 Running ESLint..." $YELLOW
if npm run lint > /dev/null 2>&1; then
    print_status "✅ Linting passed" $GREEN
else
    print_status "⚠️  Linting warnings found (not blocking push)" $YELLOW
    print_status "Run 'npm run lint' to see the warnings" $YELLOW
fi

print_status "🚀 All pre-push checks passed! Proceeding with push..." $GREEN
echo ""

exit 0
EOF

# Make hooks executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks set up successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-push: Runs type check and build before pushing"
echo ""
echo "To bypass the pre-push hook (not recommended), use:"
echo "  git push --no-verify"