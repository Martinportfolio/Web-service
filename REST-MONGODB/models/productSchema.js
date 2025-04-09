const z = require("zod");
const { ObjectId } = require("mongodb");

// Schéma pour les produits
const ProductSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
  categoryIds: z.array(z.string())
});

// Schéma pour la création de produit (sans _id)
const CreateProductSchema = ProductSchema.omit({ _id: true });

// Fonction pour valider les données avec le schéma
const validateProduct = async (productData) => {
  try {
    return { 
      success: true, 
      data: await CreateProductSchema.parseAsync(productData) 
    };
  } catch (error) {
    return { 
      success: false, 
      error 
    };
  }
};

// Fonction pour convertir les categoryIds en ObjectIds
const convertCategoryIdsToObjectIds = (categoryIds) => {
  return categoryIds.map(id => new ObjectId(id));
};

module.exports = {
  ProductSchema,
  CreateProductSchema,
  validateProduct,
  convertCategoryIdsToObjectIds
};