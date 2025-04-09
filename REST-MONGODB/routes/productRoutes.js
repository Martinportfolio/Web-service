const express = require('express');
const { ObjectId } = require('mongodb');
const { validateProduct, convertCategoryIdsToObjectIds } = require('../models/productSchema');

const router = express.Router();

// GET tous les produits avec agrégation pour les catégories
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const products = await db
      .collection('products')
      .aggregate([
        { $match: {} },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categories'
          }
        }
      ])
      .toArray();
    
    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de produit invalide' });
    }
    
    const product = await db
      .collection('products')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categories'
          }
        }
      ])
      .toArray();
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(product[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau produit
router.post('/', async (req, res) => {
  try {
    const result = await validateProduct(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données de produit invalides', errors: result.error });
    }
    
    const { name, about, price, categoryIds } = result.data;
    
    // Vérification des IDs de catégories
    for (const id of categoryIds) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: `ID de catégorie invalide: ${id}` });
      }
    }
    
    // Convertir les IDs de catégories en ObjectIds
    const categoryObjectIds = convertCategoryIdsToObjectIds(categoryIds);
    
    // Vérifier que les catégories existent
    const db = req.app.locals.db;
    const categoryCount = await db
      .collection('categories')
      .countDocuments({
        _id: { $in: categoryObjectIds }
      });
    
    if (categoryCount !== categoryIds.length) {
      return res.status(404).json({ message: 'Une ou plusieurs catégories n\'existent pas' });
    }
    
    const ack = await db
      .collection('products')
      .insertOne({ name, about, price, categoryIds: categoryObjectIds });
    
    res.status(201).json({
      _id: ack.insertedId,
      name,
      about,
      price,
      categoryIds: categoryObjectIds
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un produit
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de produit invalide' });
    }
    
    const result = await validateProduct(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données de produit invalides', errors: result.error });
    }
    
    const { name, about, price, categoryIds } = result.data;
    
    // Vérification des IDs de catégories
    for (const catId of categoryIds) {
      if (!ObjectId.isValid(catId)) {
        return res.status(400).json({ message: `ID de catégorie invalide: ${catId}` });
      }
    }
    
    // Convertir les IDs de catégories en ObjectIds
    const categoryObjectIds = convertCategoryIdsToObjectIds(categoryIds);
    
    // Vérifier que les catégories existent
    const db = req.app.locals.db;
    const categoryCount = await db
      .collection('categories')
      .countDocuments({
        _id: { $in: categoryObjectIds }
      });
    
    if (categoryCount !== categoryIds.length) {
      return res.status(404).json({ message: 'Une ou plusieurs catégories n\'existent pas' });
    }
    
    // Vérifier que le produit existe
    const existingProduct = await db
      .collection('products')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const updateResult = await db
      .collection('products')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { name, about, price, categoryIds: categoryObjectIds } }
      );
    
    res.json({
      _id: id,
      name,
      about,
      price,
      categoryIds: categoryIds
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un produit
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de produit invalide' });
    }
    
    const db = req.app.locals.db;
    
    // Vérifier que le produit existe
    const existingProduct = await db
      .collection('products')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const deleteResult = await db
      .collection('products')
      .deleteOne({ _id: new ObjectId(id) });
    
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;