echo "🎮 Запуск Blast Game..."
echo "📁 Директория: $(pwd)"
echo "🌐 Сервер: http://localhost:8080"
echo ""

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Сервер уже запущен на порту 8080"
    echo "🔗 Откройте http://localhost:8080 в браузере"
    echo ""
    echo "Для остановки сервера нажмите Ctrl+C"
    echo "Или выполните: lsof -ti:8080 | xargs kill"
else
    echo "🚀 Запуск сервера на порту 8080..."
    echo "🔗 Откройте http://localhost:8080 в браузере"
    echo ""
    echo "Для остановки сервера нажмите Ctrl+C"
    echo ""
    
    python3 -m http.server 8080
fi
