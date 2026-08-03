#!/usr/bin/env bash
# One-shot validation: install + tests + build.
# Usage: ./validate.sh   (from the frontend/ directory)
set -e
cd "$(dirname "$0")"

echo "[1/3] npm install ..."
npm install

echo "[2/3] npm test ..."
npm test

echo "[3/3] npm run build ..."
npm run build

echo "================================================"
echo "  OK - installation, tests et build OK"
echo "================================================"
