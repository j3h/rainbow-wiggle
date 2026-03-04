#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not inside a git repository."
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ -z "${BRANCH:-}" ]]; then
  echo "Could not detect current branch."
  exit 1
fi

MESSAGE="${1:-}"
if [[ -z "$MESSAGE" ]]; then
  MESSAGE="chore: update $(date +%Y-%m-%d-%H%M)"
fi

git add -A

if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "$MESSAGE"
fi

git push origin "$BRANCH"
echo "Pushed ${BRANCH}."
