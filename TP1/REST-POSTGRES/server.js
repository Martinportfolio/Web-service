// Importation des modules nécessaires
const express = require("express"); // Framework pour créer des serveurs web facilement
const postgres = require("postgres"); // Librairie pour interagir avec une base de données PostgreSQL
const z = require("zod"); // Librairie pour valider les données entrantes
const crypto = require("crypto");

// Initialisation de l'application Express
const app = express();
const port = 8000; // Port sur lequel le serveur écoutera les requêtes

// Configuration de la connexion à PostgreSQL
const sql = postgres({
  host: "localhost", // Adresse du serveur PostgreSQL
  port: 5432, // Port PostgreSQL
  database: "mydb", // Nom de la base de données
  username: "user", // Nom d'utilisateur PostgreSQL
  password: "password", // Mot de passe PostgreSQL
  ssl: false, // SSL désactivé
});

// Middleware pour lire le JSON reçu dans les requêtes
app.use(express.json());

// Schéma de validation pour un produit complet
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  password: z.string(),
  email: z.string(),
});
// Schéma pour créer un produit (sans l'id)
const CreateProductSchema = ProductSchema.omit({ id: true });
const CreateUserSchema = UserSchema.omit({ id: true });

app.post("/users", async (req, res) => {
  // Validation des données reçues via Zod
  const result = await CreateUserSchema.safeParse(req.body);

  if (result.success) {
    const { name, password, email } = result.data;

    try {
      // Insertion du produit en base de données
      const user = await sql`
        INSERT INTO users (name, password, email)
        VALUES (${name},${crypto.createHash('sha512').update(password).digest('hex')}, ${email})
        RETURNING *
      `;

      // Réponse avec le produit créé
      res.status(201).json(user[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de l'insertion en base." });
    }
  } else {
    // Données invalides
    res
      .status(400)
      .json({ error: "Données invalides.", details: result.error });
  }
});

// Route GET pour obtenir une liste paginée de produits
app.get("/users", async (req, res) => {
  // Gestion de la pagination
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const users =
      await sql`SELECT * FROM users LIMIT ${limit} OFFSET ${offset}`;
    res.json(users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits." });
  }
});

app.delete("/users/:id", async (req, res) => {
  const user = await sql`
    DELETE FROM users
    WHERE id=${req.params.id}
    RETURNING *
    `;

  if (user.length > 0) {
    res.send(user[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

// Route GET pour récupérer un produit spécifique par ID
app.get("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);

  // Validation basique de l'ID
  if (!Number.isInteger(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ error: "ID invalide, il doit être un entier positif." });
  }

  try {
    const user = await sql`SELECT * FROM users WHERE id = ${userId}`;

    if (user.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé." });
    }

    res.json(user[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du produit." });
  }
});

// Route POST pour créer un nouveau produit
app.post("/products", async (req, res) => {
  // Validation des données reçues via Zod
  const result = await CreateProductSchema.safeParse(req.body);

  if (result.success) {
    const { name, about, price } = result.data;

    try {
      // Insertion du produit en base de données
      const product = await sql`
        INSERT INTO products (name, about, price)
        VALUES (${name}, ${about}, ${price})
        RETURNING *
      `;

      // Réponse avec le produit créé
      res.status(201).json(product[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de l'insertion en base." });
    }
  } else {
    // Données invalides
    res
      .status(400)
      .json({ error: "Données invalides.", details: result.error });
  }
});

// Route GET pour obtenir une liste paginée de produits
app.get("/products", async (req, res) => {
  // Gestion de la pagination
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const products =
      await sql`SELECT * FROM products LIMIT ${limit} OFFSET ${offset}`;
    res.json(products);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits." });
  }
});

app.delete("/products/:id", async (req, res) => {
  const product = await sql`
    DELETE FROM products
    WHERE id=${req.params.id}
    RETURNING *
    `;

  if (product.length > 0) {
    res.send(product[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

// Route GET pour récupérer un produit spécifique par ID
app.get("/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  // Validation basique de l'ID
  if (!Number.isInteger(productId) || productId <= 0) {
    return res
      .status(400)
      .json({ error: "ID invalide, il doit être un entier positif." });
  }

  try {
    const product = await sql`SELECT * FROM products WHERE id = ${productId}`;

    if (product.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé." });
    }

    res.json(product[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du produit." });
  }
});

// Route GET racine pour tester le serveur
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Lancement du serveur sur le port défini
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});