const socket = io();

const username = localStorage.getItem('username');
const profilePic = localStorage.getItem('profilePic');

if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
  document.getElementById('claimButton').addEventListener('click', () => {
    const uname = document.getElementById('usernameInput').value.trim();
    const pfp = document.getElementById('profilePicInput').value.trim() || '';

    if (!uname) return alert('Enter a username');

    socket.emit('claim-username', { username: uname, profilePic: pfp }, (res) => {
      if (res.success) {
        localStorage.setItem('username', uname);
        localStorage.setItem('profilePic', pfp);
        window.location.href = 'chat.html';
      } else {
        alert(res.message);
      }
    });
  });
}

if (window.location.pathname === '/chat.html') {
  const messageInput = document.getElementById('messageInput');
  const chatBox = document.getElementById('chatBox');
  const sendImageButton = document.getElementById('sendImageButton');

  socket.emit('claim-username', {
    username,
    profilePic
  }, (res) => {
    if (!res.success) {
      alert('Username taken or invalid. Please re-login.');
      localStorage.clear();
      window.location.href = 'index.html';
    }
  });

  function addMessage({ username, message, profilePic, image }) {
    const div = document.createElement('div');
    div.style.margin = '10px';
    div.innerHTML = `
      <img src="${profilePic || 'https://via.placeholder.com/30'}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;">
      <strong>${username}</strong>: ${message}
      ${image ? `<br><img src="${image}" style="max-width:200px;margin-top:5px;">` : ''}
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
      socket.emit('send-message', {
        message: messageInput.value,
        profilePic
      });
      messageInput.value = '';
    }
  });

  sendImageButton.addEventListener('click', () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl) {
      socket.emit('send-image', {
        imageUrl,
        profilePic
      });
    }
  });

  socket.on('new-message', (data) => {
    addMessage(data);
  });
}
