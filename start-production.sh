#!/bin/bash
echo "Building QuickCash..."
pnpm run build
echo "Starting QuickCash server..."
NODE_ENV=production PORT=3000 node dist/server/_core/index.js
