// server.js - Упрощенный финальный скрипт
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Настройки порта и базы данных
const PORT = process.env.PORT || 10000; 
const DB_URI = process.env.MONGO_URI; 

// --- Обслуживание статических файлов (Для отображения чата) ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// -------------------------------------------------------------

// Подключение к MongoDB
mongoose.connect(DB_URI)
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
});

// Здесь должна быть логика Socket.io для чата (вы добавите ее позже)

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});