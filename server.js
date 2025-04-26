const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = {};

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register.html', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username taken.');
    }
    users[username] = { password };
    return res.redirect('/login.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.send('Invalid login.');
    }
    return res.redirect('/chat.html');
});

io.on('connection', (socket) => {
    socket.on('join', ({ username, profilePic }) => {
        socket.username = username;
        socket.profilePic = profilePic;
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
});

http.listen(3000, () => {
    console.log('Sharcord live on port 3000');
});
