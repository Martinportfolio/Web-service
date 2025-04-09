const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Variable pour stocker les utilisateurs connectés
const users = {};

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');
  
  // Gestion du nouvel utilisateur
  socket.on('new-user', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user-connected', username);
    // Envoyer la liste des utilisateurs connectés
    io.emit('users-list', Object.values(users));
  });

  // Gestion des messages
  socket.on('chat-message', (message) => {
    // Envoyer le message à tous les autres utilisateurs
    socket.broadcast.emit('chat-message', {
      message: message,
      username: users[socket.id]
    });
  });

  // Gestion de la frappe
  socket.on('typing', () => {
    socket.broadcast.emit('user-typing', users[socket.id]);
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('user-stop-typing');
  });

  // Gestion de la déconnexion
  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
    // Mettre à jour la liste des utilisateurs
    io.emit('users-list', Object.values(users));
    console.log('Un utilisateur s\'est déconnecté');
  });
});

// Démarrage du serveur
server.listen(port, () => {
  console.log(`Le serveur est en écoute sur http://localhost:${port}`);
});