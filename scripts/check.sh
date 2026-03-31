#!/usr/bin/env bash

if npx tsc --noEmit && npm run build; then
  echo "✓ All checks passed - safe to deploy"
else
  echo "✗ Fix errors before pushing"
  exit 1
fi
