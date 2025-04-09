const express = require("express");
const { MongoClient } = require("mongodb");

// Import des routes
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const port = 8000;

// Middleware pour parser le JSON
app.use(express.json());

// URL de connexion à MongoDB
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// Variable globale pour la base de données
let db;

// Initialisation de la connexion MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connecté avec succès à MongoDB");
    
    // Sélection de la base de données
    db = client.db("myDB");
    
    // Rendre la base de données accessible aux routes
    app.locals.db = db;
    
    // Démarrer le serveur après la connexion réussie
    app.listen(port, () => {
      console.log(`Serveur en écoute sur http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
}

// Utilisation des routes
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);

// Route de base pour tester l'API
app.get("/", (req, res) => {
  res.json({ message: "API REST avec MongoDB fonctionne!" });
});

// Connexion à MongoDB et démarrage du serveur
connectToMongoDB();

// Gestion de la fermeture propre
process.on("SIGINT", async () => {
  await client.close();
  console.log("Connexion MongoDB fermée");
  process.exit(0);
});