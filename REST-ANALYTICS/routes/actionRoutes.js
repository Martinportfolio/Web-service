const express = require('express');
const { ObjectId } = require('mongodb');
const { validateAction } = require('../models/actionSchema');

const router = express.Router();

// GET toutes les actions
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const actions = await db.collection('actions').find({}).toArray();
    res.json(actions);
  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET une action par ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'action invalide' });
    }
    
    const action = await db
      .collection('actions')
      .findOne({ _id: new ObjectId(id) });
    
    if (!action) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }
    
    res.json(action);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'action:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle action
router.post('/', async (req, res) => {
  try {
    const result = await validateAction(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données d\'action invalides', errors: result.error });
    }
    
    const actionData = result.data;
    
    const db = req.app.locals.db;
    const ack = await db.collection('actions').insertOne(actionData);
    
    res.status(201).json({
      _id: ack.insertedId,
      ...actionData
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'action:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour une action
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'action invalide' });
    }
    
    const result = await validateAction(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données d\'action invalides', errors: result.error });
    }
    
    const actionData = result.data;
    
    const db = req.app.locals.db;
    
    // Vérifier que l'action existe
    const existingAction = await db
      .collection('actions')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingAction) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }
    
    const updateResult = await db
      .collection('actions')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: actionData }
      );
    
    res.json({
      _id: id,
      ...actionData
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'action:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une action
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'action invalide' });
    }
    
    const db = req.app.locals.db;
    
    // Vérifier que l'action existe
    const existingAction = await db
      .collection('actions')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingAction) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }
    
    const deleteResult = await db
      .collection('actions')
      .deleteOne({ _id: new ObjectId(id) });
    
    res.json({ message: 'Action supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'action:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;