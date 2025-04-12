const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API E-commerce',
            version: '1.0.0',
            description: `
API pour un système e-commerce avec gestion des produits, commandes et avis.

## Cas d'erreur courants

### 400 Bad Request
- Données manquantes ou invalides dans la requête
- Score d'avis en dehors de la plage 1-5
- Format de données incorrect

### 404 Not Found
- Ressource demandée non trouvée
- ID de produit, commande ou avis inexistant

### 500 Server Error
- Erreur interne du serveur
- Problème de connexion à la base de données

## Comportements spécifiques

### Produits
- La recherche est insensible à la casse
- Les filtres peuvent être combinés
- Les prix sont en euros

### Commandes
- Le total inclut automatiquement la TVA (20%)
- Le statut de paiement est initialisé à false
- Les dates sont automatiquement gérées

### Avis
- La moyenne des scores est automatiquement mise à jour
- Les avis sont liés aux produits
- Les dates sont automatiquement gérées
            `,
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de développement',
            },
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Identifiant unique du produit' },
                        name: { type: 'string', description: 'Nom du produit' },
                        about: { type: 'string', description: 'Description du produit' },
                        price: { type: 'number', format: 'decimal', description: 'Prix en euros' },
                        review_ids: { 
                            type: 'array',
                            items: { type: 'integer' },
                            description: 'Liste des IDs des avis associés'
                        },
                        average_score: { 
                            type: 'number', 
                            format: 'decimal',
                            description: 'Moyenne des scores des avis (1-5)'
                        }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Identifiant unique de la commande' },
                        user_id: { type: 'integer', description: 'ID de l\'utilisateur' },
                        product_ids: { 
                            type: 'array',
                            items: { type: 'integer' },
                            description: 'Liste des IDs des produits commandés'
                        },
                        total: { 
                            type: 'number', 
                            format: 'decimal',
                            description: 'Total de la commande avec TVA (20%)'
                        },
                        payment: { 
                            type: 'boolean',
                            description: 'Statut du paiement'
                        },
                        created_at: { 
                            type: 'string', 
                            format: 'date-time',
                            description: 'Date de création de la commande'
                        },
                        updated_at: { 
                            type: 'string', 
                            format: 'date-time',
                            description: 'Date de dernière modification'
                        }
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Identifiant unique de l\'avis' },
                        user_id: { type: 'integer', description: 'ID de l\'utilisateur' },
                        product_id: { type: 'integer', description: 'ID du produit' },
                        score: { 
                            type: 'integer', 
                            minimum: 1, 
                            maximum: 5,
                            description: 'Note de l\'avis (1-5)'
                        },
                        content: { 
                            type: 'string',
                            description: 'Contenu de l\'avis'
                        },
                        created_at: { 
                            type: 'string', 
                            format: 'date-time',
                            description: 'Date de création de l\'avis'
                        },
                        updated_at: { 
                            type: 'string', 
                            format: 'date-time',
                            description: 'Date de dernière modification'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { 
                            type: 'string',
                            description: 'Message d\'erreur détaillé'
                        }
                    },
                    example: {
                        error: "Le score doit être entre 1 et 5"
                    }
                }
            },
            responses: {
                NotFound: {
                    description: 'Ressource non trouvée',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                error: "Produit non trouvé"
                            }
                        }
                    }
                },
                BadRequest: {
                    description: 'Requête invalide',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                error: "Données invalides"
                            }
                        }
                    }
                },
                ServerError: {
                    description: 'Erreur serveur',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                error: "Erreur serveur"
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./serveur.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Documentation API E-commerce"
    }));
}; 