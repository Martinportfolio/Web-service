const z = require('zod');

// Schéma pour les objectifs
const GoalSchema = z.object({
  source: z.string(),
  url: z.string().url(),
  goal: z.string(),
  visitor: z.string(),
  createdAt: z.date().default(() => new Date()),
  meta: z.record(z.any()).optional().default({})
});

// Fonction pour valider les données avec le schéma
const validateGoal = async (goalData) => {
  try {
    // Convertir createdAt en Date si c'est une string
    if (goalData.createdAt && typeof goalData.createdAt === 'string') {
      goalData.createdAt = new Date(goalData.createdAt);
    }
    
    return { 
      success: true, 
      data: await GoalSchema.parseAsync(goalData) 
    };
  } catch (error) {
    return { 
      success: false, 
      error 
    };
  }
};

module.exports = {
  GoalSchema,
  validateGoal
};