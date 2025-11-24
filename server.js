const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Messenger server is running!' });
});

// Socket.io для реального времени
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('send-message', (data) => {
    io.emit('receive-message', {
      id: Date.now(),
      user: data.user,
      text: data.text,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Messenger server running on port ${PORT}`);
});