#!/bin/bash
export PATH="/usr/local/bin:$PATH"
export NODE_HOME="/usr/local"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via Homebrew..."
    /opt/homebrew/bin/brew install node || /usr/local/bin/brew install node
fi

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "npx not found. Please ensure Node.js is properly installed."
    exit 1
fi

echo "Using Node.js: $(which node) ($(node --version))"
echo "Using npx: $(which npx)"

# Run the React Native config command that autolinking needs
cd ../
# Use local React Native CLI
./node_modules/.bin/react-native config 