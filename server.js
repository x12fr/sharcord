const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const users = {};
const timeouts = {};
const ADMIN_USERNAME = 'X12';
const ADMIN_PASSWORD = '331256444';

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pages
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

// Auth routes
const accounts = {};

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (accounts[username]) return res.status(400).send('Username already taken!');
    accounts[username] = { password, pfp: '/defaultpfp.png' };
    return res.redirect('/login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!accounts[username]) return res.status(400).send('No account found!');
    if (accounts[username].password !== password) return res.status(400).send('Wrong password!');
    return res.redirect('/chat?username=' + username);
});

// WebSocket
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new user', (username) => {
        const userData = accounts[username] || { pfp: '/defaultpfp.png' };
        users[socket.id] = { username, pfp: userData.pfp };
        io.emit('update userlist', Object.values(users));
    });

    socket.on('chat message', (msg) => {
        if (timeouts[users[socket.id]?.username]) return;
        const username = users[socket.id]?.username || 'Unknown';
        const pfp = users[socket.id]?.pfp || '/defaultpfp.png';
        const isLink = msg.startsWith('http://') || msg.startsWith('https://');
        io.emit('chat message', { username, message: msg, pfp, link: isLink ? `<a href="${msg}" target="_blank">${msg}</a>` : null });
    });

    socket.on('chat image', (imgData) => {
        if (timeouts[users[socket.id]?.username]) return;
        const username = users[socket.id]?.username || 'Unknown';
        const pfp = users[socket.id]?.pfp || '/defaultpfp.png';
        io.emit('chat image', { username, image: imgData, pfp });
    });

    socket.on('private message', ({ to, message }) => {
        const recipient = Object.entries(users).find(([id, u]) => u.username === to);
        if (recipient) {
            const [recipientId] = recipient;
            io.to(recipientId).emit('private message', { from: users[socket.id]?.username, message });
        }
    });

    // Admin Commands
    socket.on('admin kick', (username) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        const victim = Object.entries(users).find(([id, u]) => u.username === username);
        if (victim) io.to(victim[0]).disconnect();
    });

    socket.on('admin timeout', ({ user, seconds }) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        const target = Object.values(users).find(u => u.username === user);
        if (target) {
            timeouts[user] = true;
            io.emit('timeout', seconds);
            setTimeout(() => delete timeouts[user], seconds * 1000);
        }
    });

    socket.on('admin redirect', ({ user, link }) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        const target = Object.entries(users).find(([id, u]) => u.username === user);
        if (target) io.to(target[0]).emit('redirect', link);
    });

    socket.on('admin announce', (text) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        io.emit('announcement', text);
    });

    socket.on('admin jumpscare', ({ image, audio }) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        io.emit('jumpscare', { image, audio });
    });

    socket.on('admin strobe', () => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        io.emit('strobe');
    });

    socket.on('admin kickall', () => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        Object.keys(users).forEach(id => io.to(id).disconnect());
    });

    socket.on('admin changepfp', ({ user, url }) => {
        if (users[socket.id]?.username !== ADMIN_USERNAME) return;
        const target = Object.entries(users).find(([id, u]) => u.username === user);
        if (target) {
            const [id, targetUser] = target;
            users[id].pfp = url;
            io.emit('update userlist', Object.values(users));
        }
    });

    socket.on('change pfp', (pfpData) => {
        users[socket.id].pfp = pfpData;
        io.emit('update userlist', Object.values(users));
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update userlist', Object.values(users));
    });
});

// Start
http.listen(3000, () => console.log('Server running on http://localhost:3000'));
