#!/bin/bash
export AGENT_BROWSER_EXECUTABLE_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
NODE="C:\\Users\\Li Xiang\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe"
CLI="C:\\Users\\Li Xiang\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node_modules\\agent-browser\\bin\\agent-browser.js"
"$NODE" "$CLI" "$@"
