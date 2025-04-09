const express = require('express');
const { ObjectId } = require('mongodb');
const { validateGoal } = require('../models/goalSchema');

const router = express.Router();

// GET tous les objectifs
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const goals = await db.collection('goals').find({}).toArray();
    res.json(goals);
  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un objectif par ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'objectif invalide' });
    }
    
    const goal = await db
      .collection('goals')
      .findOne({ _id: new ObjectId(id) });
    
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objectif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET objectif par ID avec détails (views et actions)
router.get('/:id/details', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'objectif invalide' });
    }
    
    // Récupérer l'objectif
    const goal = await db
      .collection('goals')
      .findOne({ _id: new ObjectId(id) });
    
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    // Récupérer les vues associées au visiteur
    const views = await db
      .collection('views')
      .find({ visitor: goal.visitor })
      .toArray();
    
    // Récupérer les actions associées au visiteur
    const actions = await db
      .collection('actions')
      .find({ visitor: goal.visitor })
      .toArray();
    
    // Préparer la réponse avec l'objectif, les vues et les actions
    const response = {
      goal,
      analytics: {
        views,
        actions,
        summary: {
          totalViews: views.length,
          totalActions: actions.length,
          visitor: goal.visitor
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'objectif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un nouvel objectif
router.post('/', async (req, res) => {
  try {
    const result = await validateGoal(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données d\'objectif invalides', errors: result.error });
    }
    
    const goalData = result.data;
    
    const db = req.app.locals.db;
    const ack = await db.collection('goals').insertOne(goalData);
    
    res.status(201).json({
      _id: ack.insertedId,
      ...goalData
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'objectif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un objectif
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'objectif invalide' });
    }
    
    const result = await validateGoal(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Données d\'objectif invalides', errors: result.error });
    }
    
    const goalData = result.data;
    
    const db = req.app.locals.db;
    
    // Vérifier que l'objectif existe
    const existingGoal = await db
      .collection('goals')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingGoal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    const updateResult = await db
      .collection('goals')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: goalData }
      );
    
    res.json({
      _id: id,
      ...goalData
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'objectif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un objectif
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'objectif invalide' });
    }
    
    const db = req.app.locals.db;
    
    // Vérifier que l'objectif existe
    const existingGoal = await db
      .collection('goals')
      .findOne({ _id: new ObjectId(id) });
    
    if (!existingGoal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    const deleteResult = await db
      .collection('goals')
      .deleteOne({ _id: new ObjectId(id) });
    
    res.json({ message: 'Objectif supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objectif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;