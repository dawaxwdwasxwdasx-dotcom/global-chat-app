const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- 1. НАСТРОЙКА БАЗЫ ДАННЫХ ---
// ⚠️ ЗАМЕНИТЕ ЭТУ СТРОКУ ВАШИМ АКТУАЛЬНЫМ URI ИЗ MongoDB ATLAS!
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://artemolhovskiy0904_db_user:jvt4k58yFmB4xqi7@cluster0.9yomizp.mongodb.net/?appName=Cluster0'; 

// Определение схемы и модели для сообщений
const MessageSchema = new mongoose.Schema({
    chatId: String,
    sender: String,
    name: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
    id: Number, 
    type: { type: String, default: 'text' },
    replyTo: Number
});

const Message = mongoose.model('Message', MessageSchema);

mongoose.connect(DB_URI)
    .then(() => console.log('✅ MongoDB Connected!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


// Указываем, что статические файлы находятся в папке 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. ЛОГИКА SOCKET.IO И БД ---
io.on('connection', (socket) => {
    console.log(`[${socket.id}] Новый пользователь подключился.`);

    // 🚀 Обработка запроса на историю сообщений при выборе чата
    socket.on('joinChat', async (chatId) => {
        try {
            // Загружаем сообщения для конкретного чата, сортируем по времени
            const messages = await Message.find({ chatId }).sort({ timestamp: 1 }).limit(100);
            // Отправляем историю сообщений только этому клиенту
            socket.emit('messageHistory', messages); 
        } catch (error) {
            console.error('Error loading history:', error);
        }
    });

    // 💡 Обработка входящего сообщения
    socket.on('chatMessage', async (msg) => {
        try {
            // 💾 СОХРАНЯЕМ В БАЗУ ДАННЫХ
            const newMessage = new Message({
                chatId: msg.chatId,
                sender: msg.sender,
                name: msg.name,
                text: msg.text,
                id: msg.id,
                type: msg.type,
                replyTo: msg.replyTo,
                timestamp: new Date() // Используем время сервера
            });
            await newMessage.save();

            // 📢 Отправляем сообщение всем подключенным клиентам
            io.emit('message', newMessage); 
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[${socket.id}] Пользователь отключился.`);
    });
});

// Запускаем сервер на порту
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});