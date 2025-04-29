const socket = io();

const username = localStorage.getItem('username');
const profilePic = localStorage.getItem('profilePic');
const isAdmin = localStorage.getItem('isAdmin') === 'true'; // Store admin flag locally

if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
  document.getElementById('claimButton').addEventListener('click', () => {
    const uname = document.getElementById('usernameInput').value.trim();
    const pfp = document.getElementById('profilePicInput').value.trim() || '';
    const adminKey = document.getElementById('adminKeyInput').value.trim();

    if (!uname) return alert('Enter a username');

    socket.emit('claim-username', { username: uname, profilePic: pfp, adminKey }, (res) => {
      if (res.success) {
        localStorage.setItem('username', uname);
        localStorage.setItem('profilePic', pfp);
        localStorage.setItem('isAdmin', res.isAdmin); // Save if admin
        window.location.href = 'chat.html';
      } else {
        alert(res.message);
      }
    });
  });
}

if (window.location.pathname === '/chat.html') {
  const messageInput = document.getElementById('messageInput');
  const imageURLInput = document.getElementById('imageURLInput');
  const chatBox = document.getElementById('chatBox');
  const sendImageButton = document.getElementById('sendImageButton');

  socket.emit('claim-username', {
    username,
    profilePic,
    isAdmin
  }, (res) => {
    if (!res.success) {
      alert('Username taken or invalid. Please re-login.');
      localStorage.clear();
      window.location.href = 'index.html';
    }
  });

  function addMessage({ username, message, profilePic, image, isAdmin }) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
      <img src="${profilePic || 'https://via.placeholder.com/40'}" class="profile-pic">
      <div>
        <strong style="color:${isAdmin ? 'red' : 'white'}">
          ${username}${isAdmin ? ' [Administrator]' : ''}
        </strong><br>
        ${message ? message : ''}
        ${image ? `<br><img src="${image}" style="max-width:200px;margin-top:5px;">` : ''}
      </div>
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
      socket.emit('send-message', {
        message: messageInput.value,
        profilePic,
        isAdmin
      });
      messageInput.value = '';
    }
  });

  sendImageButton.addEventListener('click', () => {
    const imageUrl = imageURLInput.value.trim();
    if (imageUrl) {
      socket.emit('send-image', {
        imageUrl,
        profilePic,
        isAdmin
      });
      imageURLInput.value = '';
    }
  });

  socket.on('new-message', (data) => {
    addMessage(data);
  });
}
