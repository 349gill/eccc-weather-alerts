#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 20

cd ~/eccc-weather-alerts
OLD=$(git rev-parse HEAD)
git fetch origin main
git reset --hard origin/main
NEW=$(git rev-parse HEAD)

install_if_changed() {
  dir=$1
  if [ ! -d "$dir/node_modules" ] || [ -n "$(git diff --name-only "$OLD" "$NEW" -- "$dir" | grep -E 'package(-lock)?\.json$' || true)" ]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm ci --omit=dev)
  else
    echo "No package changes in $dir, skipping install"
  fi
}

install_if_changed src/eccc-producer-service
pm2 reload 0 --update-env

install_if_changed src/eccc-notification-api
pm2 reload 1 --update-env

pm2 save
