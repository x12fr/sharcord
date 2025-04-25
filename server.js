
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const users = {}; // socket.id -> user data
const messages = [];
const dms = {}; // {user1_user2: [messages]}
const admins = new Set();
const ownerUsername = "X12";
const ownerPassword = "331256444";

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ownerUsername && password === ownerPassword) {
        admins.add(username);
        return res.json({ success: true, owner: true });
    } else if (users[username]?.password === password) {
        admins.add(username);
        return res.json({ success: true, admin: true });
    } else if (!Object.values(users).find(u => u.username === username)) {
        users[username] = { username, password, profilePic: '', isAdmin: false };
        return res.json({ success: true });
    } else {
        return res.json({ success: false, error: 'Username taken or wrong password' });
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.json({ success: false, error: 'Username already taken' });
    }
    users[username] = { username, password, profilePic: '', isAdmin: false };
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

io.on('connection', (socket) => {
    let currentUser;

    socket.on('login', (data) => {
        currentUser = data.username;
        users[socket.id] = { ...data, socketId: socket.id };
        io.emit('update-users', Object.values(users));
        socket.emit('chat-history', messages);
    });

    socket.on('send-message', (msg) => {
        if (!currentUser) return;
        const messageData = { username: currentUser, msg, type: 'text' };
        messages.push(messageData);
        io.emit('new-message', messageData);
    });

    socket.on('send-image', (imageData) => {
        const msg = { username: currentUser, msg: imageData, type: 'image' };
        messages.push(msg);
        io.emit('new-message', msg);
    });

    socket.on('send-audio', (audioData) => {
        const msg = { username: currentUser, msg: audioData, type: 'audio' };
        messages.push(msg);
        io.emit('new-message', msg);
    });

    socket.on('send-dm', ({ to, message }) => {
        const key = [currentUser, to].sort().join('_');
        if (!dms[key]) dms[key] = [];
        const dm = { from: currentUser, to, msg: message };
        dms[key].push(dm);
        for (const id in users) {
            if (users[id].username === to || users[id].username === currentUser) {
                io.to(id).emit('dm', dm);
            }
        }
    });

    socket.on('admin-action', ({ action, target, data }) => {
        if (currentUser === ownerUsername || admins.has(currentUser)) {
            for (const id in users) {
                if (users[id].username === target) {
                    if (action === 'flash') io.to(id).emit('flash', data);
                    if (action === 'timeout') io.to(id).emit('timeout', data);
                    if (action === 'redirect') io.to(id).emit('redirect', data);
                    if (action === 'kick') io.to(id).emit('kick');
                }
            }
        }
    });

    socket.on('announce', (text) => {
        if (currentUser === ownerUsername || admins.has(currentUser)) {
            io.emit('announcement', text);
        }
    });

    socket.on('jumpscare', () => {
        if (currentUser === ownerUsername) {
            io.emit('jumpscare');
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

http.listen(PORT, () => {
    console.log(`Sharcord is running on port ${PORT}`);
});
