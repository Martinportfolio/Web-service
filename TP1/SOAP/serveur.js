const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");

const sql = postgres({ db: "mydb", user: "user", password: "password" });

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
  const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Middleware pour parser le corps des requêtes JSON
app.use(bodyParser.json());

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

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});