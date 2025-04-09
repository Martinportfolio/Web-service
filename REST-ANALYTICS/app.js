const express = require('express');
const { MongoClient } = require('mongodb');

// Import des routes
const viewRoutes = require('./routes/viewRoutes');
const actionRoutes = require('./routes/actionRoutes');
const goalRoutes = require('./routes/goalRoutes');

const app = express();
const port = 8000;

// Middleware pour parser le JSON
app.use(express.json());

// URL de connexion à MongoDB
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Variable globale pour la base de données
let db;

// Initialisation de la connexion MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connecté avec succès à MongoDB');
    
    // Sélection de la base de données
    db = client.db('analytics');
    
    // Rendre la base de données accessible aux routes
    app.locals.db = db;
    
    // Démarrer le serveur après la connexion réussie
    app.listen(port, () => {
      console.log(`Serveur d'analytics en écoute sur http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

// Utilisation des routes
app.use('/views', viewRoutes);
app.use('/actions', actionRoutes);
app.use('/goals', goalRoutes);

// Route de base pour tester l'API
app.get('/', (req, res) => {
  res.json({ message: 'API REST d\'analytics avec MongoDB fonctionne!' });
});

// Connexion à MongoDB et démarrage du serveur
connectToMongoDB();

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  await client.close();
  console.log('Connexion MongoDB fermée');
  process.exit(0);
});