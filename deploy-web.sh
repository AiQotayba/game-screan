#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 || nvm install 22
npm install -g pnpm
cd /home/game/game-screan
echo "NEXT_PUBLIC_API_URL=http://api-ga.sy-calculator.com" > web/.env
pnpm install
pnpm --filter web build
pm2 restart game-screan-web
