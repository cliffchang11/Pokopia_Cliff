#!/bin/bash

# 切換至腳本所在目錄
cd "$(dirname "$0")"

PORT=8899
NGROK_DOMAIN="blatantly-viewer-trickster.ngrok-free.dev"

echo "========================================="
echo "🛑 正在安全停止 Pokopia 外網穿透服務..."
echo "========================================="

# 1. 關閉 Ngrok
if [ -f ngrok.pid ]; then
    NGROK_PID=$(cat ngrok.pid)
    echo "   關閉 Ngrok 服務 (PID: $NGROK_PID)..."
    kill $NGROK_PID 2>/dev/null || true
    rm -f ngrok.pid
fi
pkill -f "$NGROK_DOMAIN" 2>/dev/null || true

# 2. 關閉本地伺服器
if [ -f server.pid ]; then
    SERVER_PID=$(cat server.pid)
    echo "   關閉本地 HTTP 伺服器 (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    rm -f server.pid
fi
fuser -k $PORT/tcp 2>/dev/null || true

echo "✅ Pokopia 服務已全數停止！"
echo "========================================="
