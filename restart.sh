#!/bin/bash

# 切換至腳本所在目錄
cd "$(dirname "$0")"

PORT=8899
NGROK_DOMAIN="blatantly-viewer-trickster.ngrok-free.dev"
NGROK_AUTH="3Ez8CFweIwiMiw76Ds6M6dgibp3_4WyvDy171x1Zx69XrSCZe"

echo "========================================="
echo "🔄 開始安全重啟 Pokopia 外網穿透服務"
echo "========================================="

# 1. 安全防護：僅清理專屬於此網域的舊 ngrok 隧道，絕不干擾其他服務
echo "🛑 檢查並清理殘留的專屬 Ngrok 實例 ($NGROK_DOMAIN)..."
if [ -f ngrok.pid ]; then
    OLD_NGROK_PID=$(cat ngrok.pid)
    if ps -p $OLD_NGROK_PID > /dev/null 2>&1; then
        kill $OLD_NGROK_PID 2>/dev/null || true
    fi
    rm -f ngrok.pid
fi
pkill -f "$NGROK_DOMAIN" 2>/dev/null || true
sleep 1

# 2. 守護本地 HTTP 伺服器 (Port 8899)
echo "🔍 檢查本地 HTTP 伺服器 (Port: $PORT)..."
SERVER_PID=$(lsof -t -i :$PORT 2>/dev/null)

if [ -n "$SERVER_PID" ]; then
    echo "   本地 HTTP 伺服器已在運行中 (PID: $SERVER_PID)"
    echo $SERVER_PID > server.pid
else
    echo "🚀 啟動本地 HTTP 伺服器 (Port: $PORT)..."
    nohup python3 server.py $PORT < /dev/null > /dev/null 2>&1 &
    echo $! > server.pid
    sleep 1
    SERVER_PID=$(cat server.pid)
    echo "   本地 HTTP 伺服器已成功啟動 (PID: $SERVER_PID)"
fi

# 3. 啟動 NGROK 固定通道
if [ -f "./ngrok" ]; then
    echo "🚀 啟動 Ngrok 背景通道 (網域: $NGROK_DOMAIN)..."
    nohup ./ngrok http --authtoken=$NGROK_AUTH --url=$NGROK_DOMAIN $PORT --log=stdout < /dev/null > ngrok.log 2>&1 &
    NGROK_NEW_PID=$!
    echo $NGROK_NEW_PID > ngrok.pid
    disown $NGROK_NEW_PID 2>/dev/null || true
    sleep 2
    
    if ps -p $NGROK_NEW_PID > /dev/null 2>&1; then
        echo "   Ngrok 服務已成功啟動 (PID: $NGROK_NEW_PID)"
    else
        echo "⚠️ Ngrok 啟動異常，請檢視 ngrok.log："
        tail -n 10 ngrok.log
    fi
else
    echo "❌ 找不到 ./ngrok 執行檔，無法啟動外網通道"
fi

echo "========================================="
echo "✅ 重啟完成！"
echo "👉 本機連線網址：http://localhost:$PORT"
if [ -f "./ngrok" ]; then
    echo "🌐 外網固定網址：https://$NGROK_DOMAIN"
fi
echo "========================================="
