const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Middleware
app.use(express.static('public')); // serve static files from 'public' folder
app.use(express.urlencoded({ extended: true })); // to read form data

// Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Form POST handlers
app.post('/register', (req, res) => {
  // TODO: Save new user logic (for now just redirect)
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  // TODO: Login validation (for now just redirect)
  res.redirect('/chat');
});

// Your socket.io logic goes here...

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
