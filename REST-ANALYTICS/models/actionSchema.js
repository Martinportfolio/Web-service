const z = require('zod');

// Schéma pour les actions
const ActionSchema = z.object({
  source: z.string(),
  url: z.string().url(),
  action: z.string(),
  visitor: z.string(),
  createdAt: z.date().default(() => new Date()),
  meta: z.record(z.any()).optional().default({})
});

// Fonction pour valider les données avec le schéma
const validateAction = async (actionData) => {
  try {
    // Convertir createdAt en Date si c'est une string
    if (actionData.createdAt && typeof actionData.createdAt === 'string') {
      actionData.createdAt = new Date(actionData.createdAt);
    }
    
    return { 
      success: true, 
      data: await ActionSchema.parseAsync(actionData) 
    };
  } catch (error) {
    return { 
      success: false, 
      error 
    };
  }
};

module.exports = {
  ActionSchema,
  validateAction
};