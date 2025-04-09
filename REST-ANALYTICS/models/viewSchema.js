
const z = require('zod');

// Schéma pour les vues
const ViewSchema = z.object({
  source: z.string(),
  url: z.string().url(),
  visitor: z.string(),
  createdAt: z.date().default(() => new Date()),
  meta: z.record(z.any()).optional().default({})
});

// Fonction pour valider les données avec le schéma
const validateView = async (viewData) => {
  try {
    // Convertir createdAt en Date si c'est une string
    if (viewData.createdAt && typeof viewData.createdAt === 'string') {
      viewData.createdAt = new Date(viewData.createdAt);
    }
    
    return { 
      success: true, 
      data: await ViewSchema.parseAsync(viewData) 
    };
  } catch (error) {
    return { 
      success: false, 
      error 
    };
  }
};

module.exports = {
  ViewSchema,
  validateView
};