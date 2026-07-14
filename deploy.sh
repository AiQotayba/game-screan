#!/bin/bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
npm install -g pnpm pm2
if [ -d "game-screan" ]; then
  cd game-screan
  git pull origin main
else
  git clone https://github.com/AiQotayba/game-screan.git
  cd game-screan
fi
rm -rf node_modules
rm -rf apps/api/node_modules
pnpm install
pm2 delete api-ga || true
PORT=5800 pm2 start pnpm --name "api-ga" -- start:api
pm2 save
