#!/bin/bash
# Clean environment for Electron dev server
# ELECTRON_RUN_AS_NODE must be unset, or Electron runs as plain Node.js
unset ELECTRON_RUN_AS_NODE
unset VSCODE_ESM_ENTRYPOINT
export NODE_OPTIONS=""
exec npx electron-vite dev "$@"
