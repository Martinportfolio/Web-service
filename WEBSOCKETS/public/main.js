document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    // Éléments du DOM
    const usernameModal = document.getElementById('username-modal');
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const usersList = document.getElementById('users-list');
    
    let username = '';
    let typingTimeout;
    
    // Afficher la modal pour le nom d'utilisateur
    usernameModal.style.display = 'flex';
    
    // Gérer la soumission du nom d'utilisateur
    usernameSubmit.addEventListener('click', () => {
      if (usernameInput.value.trim() !== '') {
        username = usernameInput.value.trim();
        usernameModal.style.display = 'none';
        
        // Annoncer le nouvel utilisateur au serveur
        socket.emit('new-user', username);
        
        // Afficher un message système
        displaySystemMessage(`Vous avez rejoint le chat en tant que ${username}`);
      }
    });
    
    // Gérer l'envoi de messages
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Détecter quand l'utilisateur est en train d'écrire
    messageInput.addEventListener('input', () => {
      socket.emit('typing');
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('stop-typing');
      }, 1000);
    });
    
    // Fonction pour envoyer un message
    function sendMessage() {
      const message = messageInput.value.trim();
      if (message !== '') {
        // Afficher le message dans notre propre chat
        displayMessage(message, 'sent', username);
        
        // Envoyer le message au serveur
        socket.emit('chat-message', message);
        
        // Vider le champ de saisie
        messageInput.value = '';
        
        // Indiquer qu'on a arrêté d'écrire
        socket.emit('stop-typing');
      }
    }
    
    // Fonction pour afficher un message
    function displayMessage(message, type, user) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', type);
      
      const usernameElement = document.createElement('div');
      usernameElement.classList.add('username');
      usernameElement.textContent = user;
      
      const textElement = document.createElement('div');
      textElement.textContent = message;
      
      messageElement.appendChild(usernameElement);
      messageElement.appendChild(textElement);
      
      messagesContainer.appendChild(messageElement);
      scrollToBottom();
    }
    
    // Fonction pour afficher un message système
    function displaySystemMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('system-message');
      messageElement.textContent = message;
      
      messagesContainer.appendChild(messageElement);
      scrollToBottom();
    }
    
    // Fonction pour faire défiler jusqu'au dernier message
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Mettre à jour la liste des utilisateurs
    function updateUsersList(users) {
      usersList.innerHTML = '';
      users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.textContent = user;
        usersList.appendChild(userElement);
      });
    }
    
    // Gérer les événements du serveur
    
    // Nouvel utilisateur connecté
    socket.on('user-connected', (user) => {
      displaySystemMessage(`${user} a rejoint le chat`);
    });
    
    // Réception d'un message
    socket.on('chat-message', (data) => {
      displayMessage(data.message, 'received', data.username);
    });
    
    // Quelqu'un est en train d'écrire
    socket.on('user-typing', (user) => {
      typingIndicator.textContent = `${user} est en train d'écrire...`;
    });
    
    // Plus personne n'écrit
    socket.on('user-stop-typing', () => {
      typingIndicator.textContent = '';
    });
    
    // Utilisateur déconnecté
    socket.on('user-disconnected', (user) => {
      if (user) {
        displaySystemMessage(`${user} a quitté le chat`);
      }
    });
    
    // Mettre à jour la liste des utilisateurs
    socket.on('users-list', (users) => {
      updateUsersList(users);
    });
  });