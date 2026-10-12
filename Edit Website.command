#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  print "Node.js is required. Ask the website maintainer to install Node.js, then open this file again."
  read "?Press Return to close."
  exit 1
fi
node scripts/edit-content.mjs
