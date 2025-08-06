import ollama from "ollama";

interface ResourceRecommendation {
  recommendations: Array<{
    type: string;
    reason: string;
    priority: "high" | "medium" | "low";
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  }>;
  urgencyLevel: "emergency" | "urgent" | "normal";
  nextSteps: string[];
}

interface Recipe {
  name: string;
  servings: number;
  ingredients: Array<{
    item: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
  nutritionalInfo?: {
    calories: number;
    protein: string;
    carbs: string;
  };
}

interface RationPlan {
  totalDays: number;
  peopleCount: number;
  dailyCaloriesPerPerson: number;
  rationBreakdown: Array<{
    day: number;
    meals: Array<{
      meal: string;
      items: Array<{
        item: string;
        quantityPerPerson: number;
        unit: string;
        totalQuantity: number;
      }>;
    }>;
  }>;
  recommendations: string[];
  shortages: Array<{
    item: string;
    needed: number;
    available: number;
    unit: string;
  }>;
}

class Gemma3nService {
  
  async detectLanguageAndTranslate(
    text: string, 
    targetLanguage: string = 'en'
  ): Promise<{ detectedLanguage: string; translatedText: string; confidence: number }> {
    try {
      const prompt = `You are a multilingual language expert. Analyze the following text and:
1. Detect the source language
2. Translate it to ${targetLanguage} if it's not already in that language
3. Provide confidence score (0-1)

Text: "${text}"

Respond with JSON in this exact format:
{
  "detectedLanguage": "language_code (e.g., 'en', 'es', 'fr', 'ar')",
  "translatedText": "translated text in target language",
  "confidence": confidence_score_between_0_and_1
}`;

      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt: prompt,
        format: {
            type: "object",
            properties: {
              detectedLanguage: { type: "string" },
              translatedText: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["detectedLanguage", "translatedText", "confidence"]
          },
          system: "You are a professional translator and language detection specialist with expertise in crisis communication and humanitarian contexts.",
        stream: false,
      });

      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error with language detection/translation:", error);
      throw new Error(`Language service failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getLocalizedResourceRecommendation(
    query: string, 
    userLanguage: string = 'en',
    location?: { latitude: number; longitude: number }, 
    userPreferences?: any
  ): Promise<ResourceRecommendation> {
    try {
      const languageInstruction = userLanguage !== 'en' 
        ? `Respond in ${userLanguage} language when appropriate, especially for user-facing text.` 
        : '';

      const prompt = `You are a crisis aid assistant helping people find humanitarian resources. ${languageInstruction}
      
User query: "${query}"
User language: ${userLanguage}
${location ? `User location: ${location.latitude}, ${location.longitude}` : ""}
${userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}` : ""}

Based on this query, provide recommendations for crisis resources like safehouses, food warehouses, medical facilities, or humanitarian organizations. Consider the urgency and provide actionable next steps. Use culturally appropriate language and consider regional contexts.

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "type": "safehouse|warehouse|medical|organization",
      "reason": "explanation of why this resource type is recommended",
      "priority": "high|medium|low",
      "contactInfo": {
        "phone": "emergency phone number",
        "email": "contact email",
        "website": "organization website"
      }
    }
  ],
  "urgencyLevel": "emergency|urgent|normal",
  "nextSteps": ["specific action items for the user"]
}`;

    

      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt: prompt,
        format: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    reason: { type: "string" },
                    priority: { type: "string" },
                    contactInfo: {
                      type: "object",
                      properties: {
                        phone: { type: "string" },
                        email: { type: "string" },
                        website: { type: "string" }
                      }
                    }
                  },
                  required: ["type", "reason", "priority"]
                }
              },
              urgencyLevel: { type: "string" },
              nextSteps: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["recommendations", "urgencyLevel", "nextSteps"]
          },
          system: "You are a knowledgeable crisis aid assistant with access to humanitarian resource databases. Always prioritize safety and provide accurate, helpful information for people in crisis situations. Adapt your communication style to the user's language and cultural context.",
        stream: false,
      });

      const rawJson = response.response;
      if (rawJson) {
        const result: ResourceRecommendation = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error getting localized AI recommendation:", error);
      throw new Error(`Failed to get AI recommendation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getResourceRecommendation(
    query: string, 
    location?: { latitude: number; longitude: number }, 
    userPreferences?: any
  ): Promise<ResourceRecommendation> {
    try {
      const prompt = `You are a crisis aid assistant helping people find humanitarian resources. 
      
User query: "${query}"
${location ? `User location: ${location.latitude}, ${location.longitude}` : ""}
${userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}` : ""}

Based on this query, provide recommendations for crisis resources like safehouses, food warehouses, medical facilities, or humanitarian organizations. Consider the urgency and provide actionable next steps.

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "type": "safehouse|warehouse|medical|organization",
      "reason": "explanation of why this resource type is recommended",
      "priority": "high|medium|low",
      "contactInfo": {
        "phone": "emergency phone number",
        "email": "contact email",
        "website": "organization website"
      }
    }
  ],
  "urgencyLevel": "emergency|urgent|normal",
  "nextSteps": ["specific action items for the user"]
}`;

      

      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt: prompt,
        format: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    reason: { type: "string" },
                    priority: { type: "string" },
                    contactInfo: {
                      type: "object",
                      properties: {
                        phone: { type: "string" },
                        email: { type: "string" },
                        website: { type: "string" }
                      }
                    }
                  },
                  required: ["type", "reason", "priority"]
                }
              },
              urgencyLevel: { type: "string" },
              nextSteps: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["recommendations", "urgencyLevel", "nextSteps"]
          },
          system: "You are a knowledgeable crisis aid assistant with access to humanitarian resource databases. Always prioritize safety and provide accurate, helpful information for people in crisis situations.",
        stream: false,
      });


      const rawJson = response.response;
      if (rawJson) {
        const result: ResourceRecommendation = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      throw new Error(`Failed to get AI recommendation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateRecipes(inventory: any[], peopleCount: number): Promise<Recipe[]> {
    try {
      const inventoryList = inventory.map(item => 
        `${item.itemName}: ${item.quantity} ${item.unit}`
      ).join(", ");

      const prompt = `You are a nutrition expert helping design meals for people in crisis situations. 

Available inventory: ${inventoryList}
Number of people: ${peopleCount}

Create 3-5 nutritious, practical recipes using only the available ingredients. Focus on:
1. Maximum nutrition with available ingredients
2. Simple preparation methods suitable for crisis conditions
3. Efficient use of resources
4. Cultural sensitivity and dietary considerations

Respond with JSON in this exact format:
{
  "recipes": [
    {
      "name": "recipe name",
      "servings": number,
      "ingredients": [
        {
          "item": "ingredient name",
          "quantity": number,
          "unit": "unit of measurement"
        }
      ],
      "instructions": ["step 1", "step 2", "step 3"],
      "nutritionalInfo": {
        "calories": estimated_calories_per_serving,
        "protein": "protein content estimate",
        "carbs": "carbohydrate content estimate"
      }
    }
  ]
}`;

      
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt: prompt,
        format: {
            type: "object",
            properties: {
              recipes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    servings: { type: "number" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          item: { type: "string" },
                          quantity: { type: "number" },
                          unit: { type: "string" }
                        },
                        required: ["item", "quantity", "unit"]
                      }
                    },
                    instructions: {
                      type: "array",
                      items: { type: "string" }
                    },
                    nutritionalInfo: {
                      type: "object",
                      properties: {
                        calories: { type: "number" },
                        protein: { type: "string" },
                        carbs: { type: "string" }
                      }
                    }
                  },
                  required: ["name", "servings", "ingredients", "instructions"]
                }
              }
            },
            required: ["recipes"]
          },
          system: "You are a nutritionist and crisis response expert specializing in food preparation during humanitarian emergencies.",
          stream: false,
      });


      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result.recipes || [];
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      throw new Error(`Failed to generate recipes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async calculateRations(inventory: any[], peopleCount: number, days: number = 1): Promise<RationPlan> {
    try {
      const inventoryList = inventory.map(item => 
        `${item.itemName}: ${item.quantity} ${item.unit} (expires: ${item.expiryDate || 'N/A'})`
      ).join(", ");

      const prompt = `You are a humanitarian logistics expert calculating food rations for crisis situations.

Available inventory: ${inventoryList}
Number of people: ${peopleCount}
Number of days: ${days}

Calculate optimal ration distribution considering:
1. Minimum 2000 calories per person per day
2. Balanced nutrition (protein, carbs, vitamins)
3. Food safety and expiration dates
4. Equitable distribution
5. Storage and preparation constraints

Respond with JSON in this exact format:
{
  "totalDays": ${days},
  "peopleCount": ${peopleCount},
  "dailyCaloriesPerPerson": estimated_calories,
  "rationBreakdown": [
    {
      "day": 1,
      "meals": [
        {
          "meal": "breakfast|lunch|dinner",
          "items": [
            {
              "item": "food item name",
              "quantityPerPerson": number,
              "unit": "unit",
              "totalQuantity": number
            }
          ]
        }
      ]
    }
  ],
  "recommendations": ["optimization suggestions"],
  "shortages": [
    {
      "item": "item name",
      "needed": amount_needed,
      "available": amount_available,
      "unit": "unit"
    }
  ]
}`;

      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt: prompt,
        format: {
            type: "object",
            properties: {
                totalDays: {type: "number"}, 
                peopleCount: {type: "number"}, 
                dailyCaloriesPerPerson: {type: "number"},
                rationBreakdown:{type: "array",
                    items: {
                        type: "object",
                        properties: {
                        day: { type: "number" },
                        meals: {
                            type: "array",
                            items: {
                            type: "object",
                            properties: {
                                meal: { type: "string" }, // "breakfast", "lunch", "dinner"
                                items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                    item: { type: "string" },
                                    quantityPerPerson: { type: "number" },
                                    unit: { type: "string" },
                                    totalQuantity: { type: "number" }
                                    },
                                    required: ["item", "quantityPerPerson", "unit", "totalQuantity"]
                                }
                                }
                            },
                            required: ["meal", "items"]
                            }
                        }
                        },
                        required: ["day", "meals"]
                    }},
                recommendations:{
                    type: "array",
                    items: {type: "string"}
                },
                shortages: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                        item: { type: "string" },
                        needed: { type: "number" },
                        available: { type: "number" },
                        unit: { type: "string" }
                        },
                        required: ["item", "needed", "available", "unit"]
                    }
                }
            },
            required: [
                    "totalDays",
                    "peopleCount",
                    "dailyCaloriesPerPerson",
                    "rationBreakdown",
                    "recommendations",
                    "shortages"],

        },
        system: "You are a humanitarian aid specialist with expertise in food distribution, nutrition planning, and crisis management.",
        stream: false,
      });


      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error calculating rations:", error);
      throw new Error(`Failed to calculate rations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const gemma3nService = new Gemma3nService();
