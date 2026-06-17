#!/bin/bash
# Oner 开发模式启动脚本
# 用法: bash start-dev.sh
# 前提: 需要安装 Node.js (>=20) 和 npm

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Oner development servers..."
echo "Project root: $SCRIPT_DIR"
echo

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ 未找到 node，请先安装 Node.js >= 20"
  echo "   飞牛 NAS 推荐用 Docker 部署: docker-compose up -d --build"
  exit 1
fi

echo "Starting backend on port 3000..."
(cd "$SCRIPT_DIR/backend" && node server.js) &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on port 5173..."
(cd "$SCRIPT_DIR/frontend" && npx vite --host) &
FRONTEND_PID=$!

echo
echo "Oner is starting up!"
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"

# 清理函数
cleanup() {
  echo
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
  exit 0
}

trap cleanup INT TERM
wait
