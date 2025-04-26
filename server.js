const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const users = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  socket.on('registerUser', (username) => {
    users[socket.id] = { username, pfp: '', timeout: false, tags: '' };
    io.emit('userList', Object.values(users));
  });

  socket.on('chatMessage', ({ text, to }) => {
    if (!users[socket.id].timeout) {
      const data = {
        username: users[socket.id].username,
        message: text,
        tags: users[socket.id].tags
      };
      if (to) {
        const target = Object.keys(users).find(id => users[id].username === to);
        if (target) io.to(target).emit('chatMessage', data);
      } else {
        io.emit('chatMessage', data);
      }
    }
  });

  socket.on('image', (img) => {
    io.emit('image', {
      username: users[socket.id].username,
      img
    });
  });

  socket.on('changePFP', (pfp) => {
    users[socket.id].pfp = pfp;
  });

  socket.on('adminChangePFP', ({ user, pfp }) => {
    const target = Object.keys(users).find(id => users[id].username === user);
    if (target) {
      users[target].pfp = pfp;
    }
  });

  socket.on('adminRedirect', ({ user, url }) => {
    const target = Object.keys(users).find(id => users[id].username === user);
    if (target) {
      io.to(target).emit('redirect', url);
    }
  });

  socket.on('adminKick', (user) => {
    const target = Object.keys(users).find(id => users[id].username === user);
    if (target) {
      io.to(target).disconnect();
    }
  });

  socket.on('adminTimeout', ({ user, time }) => {
    const target = Object.keys(users).find(id => users[id].username === user);
    if (target) {
      users[target].timeout = true;
      users[target].tags = '[TIMEOUT]';
      setTimeout(() => {
        if (users[target]) {
          users[target].timeout = false;
          users[target].tags = '';
        }
      }, time * 1000);
    }
  });

  socket.on('adminPlayAudio', (url) => {
    io.emit('playAudio', url);
  });

  socket.on('adminStrobe', ({ duration }) => {
    socket.emit('strobe', duration);
  });

  socket.on('adminStrobeAll', () => {
    io.emit('strobe', 5);
  });

  socket.on('adminJumpscare', ({ img, audio }) => {
    io.emit('jumpscare', { img, audio });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userList', Object.values(users));
  });
});

http.listen(3000, () => {
  console.log('Sharcord server is up!');
});
