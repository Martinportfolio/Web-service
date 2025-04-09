const express = require('express');
const { ObjectId } = require('mongodb');
const { validateView } = require('../models/viewSchema');

const router = express.Router();

// GET tous les views
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const views = await db.collection('views').find({}).toArray();
    res.json(views);
  } catch (error) {
    console.error('Erreur lors de la récupération des views:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un view par ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de view invalide' });
    }
    
    const view = await db
      .collection('views')
      .findOne({ _id: new ObjectId(id) });
    
    if (!view) {
      return res.status(404).json({ message: 'View non trouvé' });
    }
    
    res.json(view);
  } catch (error) {
    console.error('Erreur lors de la récupération du view:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau view
router.post('/', async (req, res) => {
  try {
    const result = await validateView(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données de view invalides', errors: result.error });
    }
    
    const viewData = result.data;
    
    const db = req.app.locals.db;
    const ack = await db.collection('views').insertOne(viewData);
    
    res.status(201).json({
      _id: ack.insertedId,
      ...viewData
    });
  } catch (error) {
    console.error('Erreur lors de la création du view:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un view
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de view invalide' });
    }
    
    const result = await validateView(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données de view invalides', errors: result.error });
    }
    
    const viewData = result.data;
    
    const db = req.app.locals.db;
    
    // Vérifier que le view existe
    const existingView = await db
      .collection('views')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingView) {
      return res.status(404).json({ message: 'View non trouvé' });
    }
    
    const updateResult = await db
      .collection('views')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: viewData }
      );
    
    res.json({
      _id: id,
      ...viewData
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du view:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un view
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de view invalide' });
    }
    
    const db = req.app.locals.db;
    
    // Vérifier que le view existe
    const existingView = await db
      .collection('views')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingView) {
      return res.status(404).json({ message: 'View non trouvé' });
    }
    
    const deleteResult = await db
      .collection('views')
      .deleteOne({ _id: new ObjectId(id) });
    
    res.json({ message: 'View supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du view:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;