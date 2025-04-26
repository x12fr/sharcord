const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('admin action', (action) => {
    if (action.type === 'strobe') {
      io.emit('strobe');
    } else if (action.type === 'timeout') {
      io.emit('timeout', action.user);
    } else if (action.type === 'kick') {
      io.emit('kick', action.user);
    } else if (action.type === 'redirect') {
      io.emit('redirect', action.user);
    } else if (action.type === 'spamTabs') {
      io.emit('spamTabs', action.user);
    } else if (action.type === 'clearChat') {
      io.emit('clearChat');
    } else if (action.type === 'announcement') {
      io.emit('admin action', { type: 'announcement', text: action.text });
    } else if (action.type === 'secretRedirect') {
      io.emit('admin action', { type: 'secretRedirect', user: action.user });
    } else if (action.type === 'jumpscare') {
      io.emit('jumpscare');
    }
  });
});

http.listen(3000, () => {
  console.log('Sharcord running...');
});
