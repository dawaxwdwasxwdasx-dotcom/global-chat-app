// server.js - Финальный рабочий скрипт

// 1. Импорт необходимых модулей
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const path = require('path'); // Модуль для работы с путями к файлам

// 2. Инициализация Express и Socket.io
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// 3. Конфигурация базы данных
// Используем переменную окружения MONGO_URI, заданную на Render
const DB_URI = process.env.MONGO_URI; 

// Установите порт, который предоставит Render (или 10000, как вы указали в логах)
const PORT = process.env.PORT || 10000; 

// 4. Определение модели MongoDB (если это чат, нам нужна модель сообщения)
const MessageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);


// --- КЛЮЧЕВОЙ МОМЕНТ: Обслуживание статических файлов и корневого маршрута ---
// Указываем Express, что папка 'public' содержит статический контент (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Обработка корневого маршрута (/) для отправки index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ----------------------------------------------------------------------------


// 5. Подключение к MongoDB
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected!'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    // Выход из процесса при ошибке подключения к БД
    // process.exit(1); 
});

// 6. Обработка соединений Socket.io
io.on('connection', (socket) => {
    console.log('Новый пользователь подключился.');

    // Отправка последних 50 сообщений новому пользователю
    Message.find().sort({ timestamp: -1 }).limit(50).then(messages => {
        socket.emit('load messages', messages.reverse());
    });

    // Получение нового сообщения от клиента
    socket.on('chat message', (msg) => {
        // Создание нового сообщения в БД
        const newMessage = new Message({
            sender: msg.sender || 'Anonymous', 
            content: msg.content
        });

        newMessage.save().then(() => {
            // Отправка сообщения всем подключенным клиентам
            io.emit('chat message', newMessage); 
        });
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        console.log('Пользователь отключился.');
    });
});


// 7. Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});