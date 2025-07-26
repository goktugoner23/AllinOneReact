#!/bin/bash

# Comprehensive Node.js environment setup for Android builds
export PATH="/usr/local/bin:$PATH"
export NODE_HOME="/usr/local"
export NODE_BINARY="/usr/local/bin/node"
export NODE_EXECUTABLE="/usr/local/bin/node"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        /opt/homebrew/bin/brew install node || /usr/local/bin/brew install node
    else
        echo "Homebrew not found. Please install Node.js manually."
        exit 1
    fi
fi

# Verify node installation
echo "Using Node.js: $(which node) ($(node --version))"
echo "Using npm: $(which npm) ($(npm --version))"

# Execute the passed command with proper environment
exec "$@" 