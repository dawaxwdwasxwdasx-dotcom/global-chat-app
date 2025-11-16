// server.js - Финальный рабочий скрипт
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- Переменные окружения Render ---
// Render требует использовать порт, который он предоставляет
const PORT = process.env.PORT || 10000; 
const DB_URI = process.env.MONGO_URI; 

// 1. Определение модели MongoDB
const MessageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);


// 2. Обслуживание статических файлов (HTML, CSS, JS)
// Это исправляет ошибку "Cannot GET /"
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// 3. Подключение к MongoDB
mongoose.connect(DB_URI)
.then(() => console.log('✅ MongoDB Connected!'))
.catch(err => {
    // Эта ошибка должна была исчезнуть после исправления MONGO_URI
    console.error('❌ MongoDB Connection Error:', err);
});


// 4. Логика Socket.io для чата
io.on('connection', (socket) => {
    console.log('Новый пользователь подключился.');

    // Отправка последних сообщений при подключении
    Message.find().sort({ timestamp: -1 }).limit(50).then(messages => {
        socket.emit('load messages', messages.reverse());
    });

    // Обработка нового сообщения
    socket.on('chat message', (msg) => {
        const newMessage = new Message({
            sender: msg.sender || 'Anonymous', 
            content: msg.content
        });

        newMessage.save().then(() => {
            // Отправка сообщения всем клиентам
            io.emit('chat message', newMessage); 
        });
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился.');
    });
});


// 5. Запуск сервера на порту Render
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});