#!/bin/bash

echo "=== Docker Build Debugging ==="
echo ""

# Step 1: Check if .env.local exists
echo "1. Checking .env.local file:"
if [ -f .env.local ]; then
    echo "   ✓ .env.local exists"
else
    echo "   ✗ .env.local NOT found"
    exit 1
fi
echo ""

# Step 2: Show the Clerk key from file
echo "2. Clerk key in .env.local:"
grep "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local
echo ""

# Step 3: Check current shell environment
echo "3. Clerk key in shell environment:"
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "   ✗ NOT SET in shell environment"
    echo "   This is the problem!"
else
    echo "   ✓ SET: $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
fi
echo ""

# Step 4: Load environment variables
echo "4. Loading .env.local into shell..."
set -a
source .env.local
set +a
echo "   ✓ Loaded"
echo ""

# Step 5: Verify it's loaded
echo "5. Verifying Clerk key is now in shell:"
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "   ✗ Still NOT SET"
else
    echo "   ✓ SET: $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
fi
echo ""

# Step 6: Show the docker build command
echo "6. Docker build command that will be used:"
echo "   docker build --no-cache \\"
echo "     --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\"$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\" \\"
echo "     -t resumegen-app ."
echo ""

# Step 7: Ask user if they want to proceed
read -p "Do you want to run the Docker build now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Docker build..."
    docker build --no-cache \
      --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
      -t resumegen-app .
else
    echo "Build cancelled. You can run the build manually with the command shown above."
fi
