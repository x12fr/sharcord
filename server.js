
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.post('/register', (req, res) => {
    // Placeholder for registration logic
});

app.post('/login', (req, res) => {
    // Placeholder for login logic
});

io.on('connection', socket => {
    socket.on('send_message', message => {
        io.emit('receive_message', message); // Broadcast message to all
    });
});

http.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
    