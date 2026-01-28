#!/bin/bash
# launch_agent_chrome.sh
# Launches Google Chrome in 'Agent-Ready' mode (Remote Debugging Enabled).
# 
# CONFIGURATION
# Debug Port: 9222
# Profile:    Profile 2 (jorian@intrinsic.com.de)

PORT=9222
PROFILE="Profile 2"

echo "🚀 Launching Chrome in Agent-Ready Mode..."
echo "----------------------------------------"
echo "🔧 Debug Port: $PORT"
echo "👤 Profile:    $PROFILE"
echo "🔓 Origins:    Allowed (*)"
echo ""

# Check if Chrome is already running
if pgrep -x "Google Chrome" > /dev/null; then
    echo "⚠️  Chrome is already running!"
    echo "   To switch to Agent-Ready mode with the correct profile, we need to restart it."
    read -p "   Kill Chrome now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill "Google Chrome"
        sleep 1
        echo "💀 Chrome killed."
    else
        echo "❌ Aborted. Please quit Chrome manually and try again."
        exit 1
    fi
fi

# Launch Chrome with specific profile and debugging flags
open -a "Google Chrome" --args \
    --remote-debugging-port=$PORT \
    --remote-allow-origins=* \
    --profile-directory="$PROFILE"

echo "✅ Chrome launched (Profile: $PROFILE)!"
echo "   Automated tools can now access this session."
