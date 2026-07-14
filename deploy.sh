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
pnpm install
pnpm build
pm2 delete api-ga || true
pm2 delete game-screan-web || true
PORT=5800 pm2 start pnpm --name "api-ga" -- start:api
pm2 start pnpm --name "game-screan-web" -- start:web
pm2 save
