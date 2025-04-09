const express = require("express");
const { ObjectId } = require("mongodb");
const { validateCategory } = require("../models/categorySchema");

const router = express.Router();

// GET toutes les catégories
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const categories = await db.collection("categories").find({}).toArray();
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET une catégorie par ID
router.get("/:id", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(id) });
    
    if (!category) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST - Créer une nouvelle catégorie
router.post("/", async (req, res) => {
  try {
    const result = await validateCategory(req.body);
    
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    
    const { name } = result.data;
    
    const db = req.app.locals.db;
    const ack = await db.collection("categories").insertOne({ name });
    
    res.status(201).json({
      _id: ack.insertedId,
      name
    });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT - Mettre à jour une catégorie
router.put("/:id", async (req, res) => {
  try {
    const result = await validateCategory(req.body);
    
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    
    const { name } = result.data;
    const id = req.params.id;
    
    const db = req.app.locals.db;
    const updateResult = await db
      .collection("categories")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { name } }
      );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    
    res.json({
      _id: id,
      name
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE - Supprimer une catégorie
router.delete("/:id", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    // Vérifier si des produits utilisent cette catégorie
    const products = await db
      .collection("products")
      .find({ categoryIds: new ObjectId(id) })
      .toArray();
    
    if (products.length > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer cette catégorie car elle est utilisée par des produits" 
      });
    }
    
    const deleteResult = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(id) });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    
    res.json({ message: "Catégorie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;