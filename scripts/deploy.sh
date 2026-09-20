#!/usr/bin/env bash
set -e

swapon --show | grep -q /swap || {
  sudo fallocate -l 5G /swap
  sudo chmod 600 /swap
  sudo mkswap /swap
  sudo swapon /swap
}

. ~/.nvm/nvm.sh
nvm use 20

cd ~/eccc-weather-alerts
git pull

cd src/eccc-producer-service
npm ci
pm2 reload 0

cd ../eccc-notification-api
npm ci
pm2 reload 1
