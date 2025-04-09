const z = require("zod");

// Schéma pour les catégories
const CategorySchema = z.object({
  _id: z.string().optional(),
  name: z.string()
});

// Schéma pour la création de catégorie (sans _id)
const CreateCategorySchema = CategorySchema.omit({ _id: true });

// Fonction pour valider les données avec le schéma
const validateCategory = async (categoryData) => {
  try {
    return { 
      success: true, 
      data: await CreateCategorySchema.parseAsync(categoryData) 
    };
  } catch (error) {
    return { 
      success: false, 
      error 
    };
  }
};

module.exports = {
  CategorySchema,
  CreateCategorySchema,
  validateCategory
};