const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");
const express = require('express');
const bodyParser = require('body-parser');
const swaggerConfig = require('./swagger');

const app = express();
app.use(bodyParser.json());

// Configuration de la base de données
const sql = postgres({ db: "mydb", user: "user", password: "password" });

// Initialisation de la base de données
async function initDatabase() {
    try {
        // Table des produits
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                about TEXT,
                price DECIMAL(10,2) NOT NULL,
                review_ids INTEGER[] DEFAULT '{}',
                average_score DECIMAL(3,2) DEFAULT 0
            )
        `;

        // Table des commandes
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                product_ids INTEGER[] NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                payment BOOLEAN DEFAULT false,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        `;

        // Table des avis
        await sql`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
                content TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        `;

        console.log('Base de données initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
    }
}

// Initialiser la base de données
initDatabase();

// Configuration Swagger
swaggerConfig(app);

// Define the service implementation
const service = {
  ProductsService: {
    ProductsPort: {
      CreateProduct: async function ({ name, about, price }, callback) {
        if (!name || !about || !price) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "Processing Error" },
              statusCode: 400,
            },
          };
        }

        const product = await sql`
          INSERT INTO products (name, about, price)
          VALUES (${name}, ${about}, ${price})
          RETURNING *
          `;

        // Will return only one element.
        callback(product[0]);
      },
      },
        },
      };

// http server example
const server = http.createServer(function (request, response) {
    response.end("404: Not Found: " + request.url);
  });

  server.listen(8000);

  // Create the SOAP server
  const xml = fs.readFileSync("productsService.wsdl", "utf8");
  soap.listen(server, "/products", service, xml, function () {
    console.log("SOAP server running at http://localhost:8000/products?wsdl");
  });

// Simulons une base de données avec un tableau
let products = [
    { id: 1, name: 'Produit A', price: 100 },
    { id: 2, name: 'Produit B', price: 200 },
];

// Opération PatchProduct
app.patch('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    // Vérification si le produit existe
    if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérification des arguments
    const { name, price } = req.body;
    if (name === undefined && price === undefined) {
        return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    // Mise à jour des propriétés du produit
    if (name !== undefined) {
        product.name = name;
    }
    if (price !== undefined) {
        product.price = price;
    }

    return res.status(200).json(product);
});

// Opération DeleteProduct
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    // Vérification si le produit existe
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Suppression du produit
    products.splice(productIndex, 1);
    return res.status(204).send(); // 204 No Content
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Récupère la liste des produits
 *     description: Retourne la liste des produits avec possibilité de filtrage
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtre par nom de produit
 *       - in: query
 *         name: about
 *         schema:
 *           type: string
 *         description: Filtre par description
 *       - in: query
 *         name: price
 *         schema:
 *           type: number
 *         description: Filtre par prix maximum
 *     responses:
 *       200:
 *         description: Liste des produits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/products', async (req, res) => {
    try {
        const { name, about, price } = req.query;
        let query = sql`SELECT * FROM products WHERE 1=1`;
        
        if (name) {
            query = query` AND name ILIKE ${'%' + name + '%'}`;
        }
        
        if (about) {
            query = query` AND about ILIKE ${'%' + about + '%'}`;
        }
        
        if (price) {
            query = query` AND price <= ${parseFloat(price)}`;
        }
        
        const products = await query;
        res.json(products);
    } catch (error) {
        console.error('Erreur lors de la recherche des produits:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Récupère un produit par son ID
 *     description: Retourne les détails d'un produit avec ses avis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Détails du produit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/products/:id', async (req, res) => {
    try {
        const product = await sql`
            SELECT p.*, 
                   json_agg(r.*) as reviews,
                   json_agg(u.*) as review_users
            FROM products p
            LEFT JOIN reviews r ON r.id = ANY(p.review_ids)
            LEFT JOIN users u ON u.id = r.user_id
            WHERE p.id = ${req.params.id}
            GROUP BY p.id
        `;

        if (product.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        res.json(product[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Routes pour les commandes (Orders)
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crée une nouvelle commande
 *     description: Crée une commande avec les produits sélectionnés
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productIds
 *             properties:
 *               userId:
 *                 type: integer
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Commande créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/orders', async (req, res) => {
    try {
        const { userId, productIds } = req.body;
        
        if (!userId || !productIds || !Array.isArray(productIds)) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        // Récupérer les prix des produits
        const products = await sql`
            SELECT price FROM products 
            WHERE id = ANY(${productIds})
        `;

        // Calculer le total avec TVA
        const total = products.reduce((sum, product) => sum + parseFloat(product.price), 0) * 1.2;

        const order = await sql`
            INSERT INTO orders (user_id, product_ids, total, payment, created_at, updated_at)
            VALUES (${userId}, ${productIds}, ${total}, false, NOW(), NOW())
            RETURNING *
        `;

        res.status(201).json(order[0]);
    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/orders', async (req, res) => {
    try {
        const orders = await sql`
            SELECT o.*, 
                   json_agg(p.*) as products,
                   u.* as user
            FROM orders o
            LEFT JOIN products p ON p.id = ANY(o.product_ids)
            LEFT JOIN users u ON u.id = o.user_id
            GROUP BY o.id, u.id
        `;
        res.json(orders);
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        const order = await sql`
            SELECT o.*, 
                   json_agg(p.*) as products,
                   u.* as user
            FROM orders o
            LEFT JOIN products p ON p.id = ANY(o.product_ids)
            LEFT JOIN users u ON u.id = o.user_id
            WHERE o.id = ${req.params.id}
            GROUP BY o.id, u.id
        `;

        if (order.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        res.json(order[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.patch('/orders/:id', async (req, res) => {
    try {
        const { payment } = req.body;
        
        if (payment === undefined) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        const order = await sql`
            UPDATE orders 
            SET payment = ${payment},
                updated_at = NOW()
            WHERE id = ${req.params.id}
            RETURNING *
        `;

        if (order.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        res.json(order[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la commande:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.delete('/orders/:id', async (req, res) => {
    try {
        const result = await sql`
            DELETE FROM orders 
            WHERE id = ${req.params.id}
            RETURNING id
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de la commande:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Routes pour les avis (Reviews)
/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Crée un nouvel avis
 *     description: Crée un avis pour un produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - score
 *               - content
 *             properties:
 *               userId:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Avis créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/reviews', async (req, res) => {
    try {
        const { userId, productId, score, content } = req.body;
        
        if (!userId || !productId || !score || !content) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        if (score < 1 || score > 5) {
            return res.status(400).json({ error: 'Le score doit être entre 1 et 5' });
        }

        const review = await sql`
            INSERT INTO reviews (user_id, product_id, score, content, created_at, updated_at)
            VALUES (${userId}, ${productId}, ${score}, ${content}, NOW(), NOW())
            RETURNING *
        `;

        // Mettre à jour la moyenne des scores du produit
        await sql`
            UPDATE products p
            SET 
                review_ids = array_append(p.review_ids, ${review[0].id}),
                average_score = (
                    SELECT AVG(score)
                    FROM reviews
                    WHERE product_id = ${productId}
                )
            WHERE p.id = ${productId}
        `;

        res.status(201).json(review[0]);
    } catch (error) {
        console.error('Erreur lors de la création de l\'avis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/reviews', async (req, res) => {
    try {
        const reviews = await sql`
            SELECT r.*, u.* as user, p.* as product
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            LEFT JOIN products p ON p.id = r.product_id
        `;
        res.json(reviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/reviews/:id', async (req, res) => {
    try {
        const review = await sql`
            SELECT r.*, u.* as user, p.* as product
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            LEFT JOIN products p ON p.id = r.product_id
            WHERE r.id = ${req.params.id}
        `;

        if (review.length === 0) {
            return res.status(404).json({ error: 'Avis non trouvé' });
        }

        res.json(review[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'avis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.patch('/reviews/:id', async (req, res) => {
    try {
        const { score, content } = req.body;
        
        if (!score && !content) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        if (score && (score < 1 || score > 5)) {
            return res.status(400).json({ error: 'Le score doit être entre 1 et 5' });
        }

        const review = await sql`
            UPDATE reviews 
            SET 
                score = COALESCE(${score}, score),
                content = COALESCE(${content}, content),
                updated_at = NOW()
            WHERE id = ${req.params.id}
            RETURNING *
        `;

        if (review.length === 0) {
            return res.status(404).json({ error: 'Avis non trouvé' });
        }

        // Mettre à jour la moyenne des scores du produit
        await sql`
            UPDATE products p
            SET average_score = (
                SELECT AVG(score)
                FROM reviews
                WHERE product_id = p.id
            )
            WHERE p.id = ${review[0].product_id}
        `;

        res.json(review[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'avis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.delete('/reviews/:id', async (req, res) => {
    try {
        const review = await sql`
            DELETE FROM reviews 
            WHERE id = ${req.params.id}
            RETURNING *
        `;

        if (review.length === 0) {
            return res.status(404).json({ error: 'Avis non trouvé' });
        }

        // Mettre à jour la moyenne des scores du produit
        await sql`
            UPDATE products p
            SET 
                review_ids = array_remove(p.review_ids, ${req.params.id}),
                average_score = (
                    SELECT AVG(score)
                    FROM reviews
                    WHERE product_id = p.id
                )
            WHERE p.id = ${review[0].product_id}
        `;

        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'avis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});