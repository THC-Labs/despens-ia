import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const runtimeFilename = typeof __filename !== "undefined" 
  ? __filename 
  : fileURLToPath(import.meta.url);
const runtimeDirname = typeof __dirname !== "undefined" 
  ? __dirname 
  : path.dirname(runtimeFilename);
const dbPath = path.join(runtimeDirname, "db.json");

// Inicializar el cliente del SDK de Google GenAI en el servidor
// con la cabecera correspondiente requerida por AI Studio Build
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Inicializar base de datos local JSON si no existe
const defaultDb = {
  inventory: [
    { id: "1", name: "Arroz Integral", quantity: 1000, unit: "g", category: "Granos", last_updated: new Date().toISOString() },
    { id: "2", name: "Pechuga de Pollo", quantity: 600, unit: "g", category: "Carnes", last_updated: new Date().toISOString() },
    { id: "3", name: "Huevos Orgánicos", quantity: 12, unit: "uds", category: "Lácteos/Huevos", last_updated: new Date().toISOString() },
    { id: "4", name: "Tomates frescos", quantity: 6, unit: "uds", category: "Verduras/Frutas", last_updated: new Date().toISOString() },
    { id: "5", name: "Aguacate Maduro", quantity: 3, unit: "uds", category: "Verduras/Frutas", last_updated: new Date().toISOString() },
    { id: "6", name: "Leche de Avena", quantity: 1000, unit: "ml", category: "Lácteos/Huevos", last_updated: new Date().toISOString() }
  ],
  recipes: [
    {
      id: "r1",
      title: "Fajitas de Pollo Fit",
      ingredients_required: [
        { name: "Pechuga de Pollo", quantity: 250, unit: "g" },
        { name: "Tomates frescos", quantity: 2, unit: "uds" },
        { name: "Aguacate Maduro", quantity: 1, unit: "uds" }
      ],
      instructions: "1. Corta la pechuga de pollo y los tomates en tiras medianas.\n2. Cocina el pollo en una sartén caliente con especias y sal al gusto.\n3. Agrega los tomates al final de la cocción de modo que conserven cierta firmeza.\n4. Sirve en un plato adornando con rebanadas finas de aguacate maduro.",
      macros_summary: "380 kcal | P: 32g | C: 12g | G: 18g",
      created_at: new Date().toISOString()
    },
    {
      id: "r2",
      title: "Tortilla Deportiva con Aguacate",
      ingredients_required: [
        { name: "Huevos Orgánicos", quantity: 3, unit: "uds" },
        { name: "Aguacate Maduro", quantity: 0.5, unit: "uds" }
      ],
      instructions: "1. Bate los huevos en un plato hondo con sal y pimienta.\n2. Engrasa levemente una sartén caliente y vierte los huevos batidos.\n3. Deja cuajar y voltea con la ayuda de una espátula.\n4. Agrega el aguacate laminado en medio antes de doblar la tortilla y servir en caliente.",
      macros_summary: "320 kcal | P: 20g | C: 4g | G: 24g",
      created_at: new Date().toISOString()
    }
  ],
  meal_plan: [
    {
      id: "mp1",
      date: new Date().toISOString().split("T")[0],
      meal_type: "Comida",
      recipe_id: "r1",
      status: "planned"
    },
    {
      id: "mp2",
      date: new Date().toISOString().split("T")[0],
      meal_type: "Cena",
      recipe_id: "r2",
      status: "planned"
    }
  ],
  recipes_cache: [],
  ai_usage: {
    month: new Date().toISOString().substring(0, 7),
    count: 0
  }
};

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
      return defaultDb;
    }
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo base de datos del archivo JSON:", err);
    return defaultDb;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error escribiendo base de datos al archivo JSON:", err);
  }
}

// Variable de entorno para sobreescribir el modelo por defecto de forma económica (ej: gemini-2.5-flash-lite)
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function checkAndIncrementAiUsage(): boolean {
  try {
    const db = readDb();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const maxCalls = process.env.MAX_MONTHLY_AI_CALLS ? parseInt(process.env.MAX_MONTHLY_AI_CALLS, 10) : 500;

    if (!db.ai_usage || db.ai_usage.month !== currentMonth) {
      db.ai_usage = {
        month: currentMonth,
        count: 0
      };
    }

    if (db.ai_usage.count >= maxCalls) {
      console.warn(`[AI LIMIT EXCEEDED] Límite mensual de llamadas superado (${db.ai_usage.count}/${maxCalls}) en ${currentMonth}`);
      return false;
    }

    db.ai_usage.count += 1;
    writeDb(db);
    console.log(`[AI LIMIT CHECK] Llamada registrada: ${db.ai_usage.count}/${maxCalls} para el mes ${currentMonth}`);
    return true;
  } catch (err) {
    console.error("Error al comprobar o guardar el contador de cuota de IA:", err);
    return true; // Continuar por seguridad en caso de fallos de E/S de la BD local
  }
}

// ==========================================
// RUTA REST API: INVENTARIO (inventory)
// ==========================================
app.get("/api/inventory", (req, res) => {
  const db = readDb();
  res.json(db.inventory);
});

app.post("/api/inventory", (req, res) => {
  const db = readDb();
  const newItem = {
    id: Math.random().toString(36).substring(2, 9),
    name: req.body.name,
    quantity: parseFloat(req.body.quantity) || 0,
    unit: req.body.unit || "uds",
    category: req.body.category || "Otros",
    last_updated: new Date().toISOString()
  };
  db.inventory.push(newItem);
  writeDb(db);
  res.json(newItem);
});

app.put("/api/inventory/:id", (req, res) => {
  const db = readDb();
  const idx = db.inventory.findIndex((item: any) => item.id === req.params.id);
  if (idx > -1) {
    db.inventory[idx] = {
      ...db.inventory[idx],
      name: req.body.name !== undefined ? req.body.name : db.inventory[idx].name,
      quantity: req.body.quantity !== undefined ? parseFloat(req.body.quantity) : db.inventory[idx].quantity,
      unit: req.body.unit !== undefined ? req.body.unit : db.inventory[idx].unit,
      category: req.body.category !== undefined ? req.body.category : db.inventory[idx].category,
      last_updated: new Date().toISOString()
    };
    writeDb(db);
    res.json(db.inventory[idx]);
  } else {
    res.status(404).json({ error: "Item de inventario no encontrado" });
  }
});

app.delete("/api/inventory/:id", (req, res) => {
  const db = readDb();
  db.inventory = db.inventory.filter((item: any) => item.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.post("/api/inventory/bulk", (req, res) => {
  const db = readDb();
  const items = req.body.items || [];
  const addedItems = [];
  for (const item of items) {
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: item.name,
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit || "uds",
      category: item.category || "Otros",
      last_updated: new Date().toISOString()
    };
    db.inventory.push(newItem);
    addedItems.push(newItem);
  }
  writeDb(db);
  res.json(addedItems);
});


// ==========================================
// RUTA REST API: RECETAS (recipes)
// ==========================================
app.get("/api/recipes", (req, res) => {
  const db = readDb();
  res.json(db.recipes);
});

app.post("/api/recipes", (req, res) => {
  const db = readDb();
  const newRecipe = {
    id: "r_" + Math.random().toString(36).substring(2, 9),
    title: req.body.title,
    ingredients_required: req.body.ingredients_required || [],
    instructions: req.body.instructions,
    macros_summary: req.body.macros_summary || "",
    likes: 0,
    created_at: new Date().toISOString()
  };
  db.recipes.push(newRecipe);
  writeDb(db);
  res.json(newRecipe);
});

app.post("/api/recipes/:id/like", (req, res) => {
  const db = readDb();
  const recipe = db.recipes.find((r: any) => r.id === req.params.id);
  if (recipe) {
    recipe.likes = (recipe.likes || 0) + 1;
    writeDb(db);
    res.json({ success: true, likes: recipe.likes });
  } else {
    res.status(404).json({ error: "Receta no encontrada" });
  }
});

app.delete("/api/recipes/:id", (req, res) => {
  const db = readDb();
  db.recipes = db.recipes.filter((item: any) => item.id !== req.params.id);
  // Borrar de planificación también por cascada de relación referencial
  db.meal_plan = db.meal_plan.filter((item: any) => item.recipe_id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});


// ==========================================
// RUTA REST API: PLANIFICADOR DE MENÚS (meal_plan)
// ==========================================
app.get("/api/meal-plan", (req, res) => {
  const db = readDb();
  res.json(db.meal_plan);
});

app.post("/api/meal-plan", (req, res) => {
  const db = readDb();
  const newItem = {
    id: "mp_" + Math.random().toString(36).substring(2, 9),
    date: req.body.date,
    plannerDay: req.body.plannerDay || "Lunes",
    meal_type: req.body.meal_type || "Comida",
    recipe_id: req.body.recipe_id,
    status: req.body.status || "planned"
  };
  db.meal_plan.push(newItem);
  writeDb(db);
  res.json(newItem);
});

app.put("/api/meal-plan/:id", (req, res) => {
  const db = readDb();
  const idx = db.meal_plan.findIndex((item: any) => item.id === req.params.id);
  if (idx > -1) {
    db.meal_plan[idx] = {
      ...db.meal_plan[idx],
      status: req.body.status !== undefined ? req.body.status : db.meal_plan[idx].status,
      date: req.body.date !== undefined ? req.body.date : db.meal_plan[idx].date,
      plannerDay: req.body.plannerDay !== undefined ? req.body.plannerDay : db.meal_plan[idx].plannerDay,
      meal_type: req.body.meal_type !== undefined ? req.body.meal_type : db.meal_plan[idx].meal_type
    };
    writeDb(db);
    res.json(db.meal_plan[idx]);
  } else {
    res.status(404).json({ error: "Planificación no encontrada" });
  }
});

app.delete("/api/meal-plan/:id", (req, res) => {
  const db = readDb();
  db.meal_plan = db.meal_plan.filter((item: any) => item.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});


// ==========================================
// RUTA DE IA: GENERAR RECETA CON GEMINI
// ==========================================
app.post("/api/gemini/recipe", async (req, res) => {
  const { selectedIngredients, extraPrompt, allergies, preferences, cookingStyle, forceRegenerate } = req.body;
  if (!selectedIngredients || selectedIngredients.length === 0) {
    return res.status(400).json({ error: "No seleccionaste ningún ingrediente de tu despensa." });
  }

  const ingredientsListStr = selectedIngredients.map((item: any) => `- ${item.name} (${item.quantity} ${item.unit})`).join("\n");
  const allergiesStr = allergies && allergies.length > 0 ? allergies.join(", ") : "Ninguna";
  const preferencesStr = preferences && preferences.length > 0 ? preferences.join(", ") : "Ninguna";
  const cookingStyleStr = cookingStyle || "Saludable y Balanceada";

  // Generar clave única para la caché de recetas basada en inputs
  const sortedNames = [...selectedIngredients]
    .map((item: any) => `${item.name.trim().toLowerCase()}:${item.quantity}${item.unit}`)
    .sort()
    .join("|");
  const cacheKeyInput = `ingredients:${sortedNames};allergies:${allergiesStr.toLowerCase()};preferences:${preferencesStr.toLowerCase()};style:${cookingStyleStr.toLowerCase()};extra:${(extraPrompt || "").trim().toLowerCase()}`;
  const cacheKey = crypto.createHash("md5").update(cacheKeyInput).digest("hex");

  const db = readDb();
  if (!db.recipes_cache) {
    db.recipes_cache = [];
  }

  // Si no se fuerza la regeneración, comprobar caché
  if (!forceRegenerate) {
    const cached = db.recipes_cache.find((item: any) => item.key === cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] Retornando receta guardada en caché para key: ${cacheKey}`);
      return res.json(cached.recipe);
    }
  }

  // Validar y descontar cuota mensual de IA
  if (!checkAndIncrementAiUsage()) {
    return res.status(429).json({ error: "Se ha alcanzado el límite mensual de consultas de Inteligencia Artificial. Prueba de nuevo el próximo mes o contacta al administrador." });
  }

  const prompt = `Actúa como un chef profesional y diseñador de planes alimenticios saludables.
Tengo los siguientes ingredientes disponibles en mi despensa:
${ingredientsListStr}

Restricciones y Preferencias de Salud/Dieta del Usuario:
- Alergias/Intolerancias alimenticias: ${allergiesStr}. EXCLUYE estrictamente estos alérgenos e intolerancias de la receta.
- Preferencias de gustos/ingredientes: ${preferencesStr}.
- Estilo de cocina deseado: ${cookingStyleStr}.

${extraPrompt ? `Instrucciones o preferencias adicionales del usuario: "${extraPrompt}"` : ""}

Crea una receta deliciosa, creativa y balanceada utilizando todos o algunos de estos ingredientes. 
Devuelve la respuesta strictly en formato JSON con la siguiente estructura (no agregues texto fuera de esta estructura JSON):
{
  "title": "Nombre creativo e inspirador de la receta (en español)",
  "ingredients_required": [
    {"name": "Nombre de ingrediente", "quantity": "cantidad", "unit": "unidad"}
  ],
  "instructions": "Instrucciones numeradas en pasos claros y concisos (ejemplo: '1. Calentar sartén... \\n2. Añadir verduras...').",
  "macros_summary": "Un resumen estimado de macros como '420 kcal | Proteínas: 28g | Carbohidratos: 45g | Grasas: 14g'"
}

Asegúrate de responder en español. No introduzcas marcas de código como \`\`\`json ni nada de eso. Devuelve directamente el objeto JSON válido.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients_required: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  unit: { type: Type.STRING }
                },
                required: ["name", "quantity", "unit"]
              }
            },
            instructions: { type: Type.STRING },
            macros_summary: { type: Type.STRING }
          },
          required: ["title", "ingredients_required", "instructions", "macros_summary"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : "";
    if (!bodyText) {
      throw new Error("Respuesta vacía de Gemini.");
    }

    try {
      const parsed = JSON.parse(bodyText);

      // Guardar en la caché local
      const dbUpdate = readDb();
      if (!dbUpdate.recipes_cache) {
        dbUpdate.recipes_cache = [];
      }
      dbUpdate.recipes_cache.push({
        key: cacheKey,
        recipe: parsed,
        created_at: new Date().toISOString()
      });
      writeDb(dbUpdate);

      res.json(parsed);
    } catch (parseError) {
      console.error("Fallo al parsear JSON devuelto por Gemini:", bodyText);
      // Fallback
      res.json({
        title: "Sugerencia Inteligente Express",
        ingredients_required: selectedIngredients.map((it: any) => ({ name: it.name, quantity: "al gusto", unit: "" })),
        instructions: "1. Mezcla los ingredientes seleccionados de forma armoniosa en una cacerola u horno.\n2. Cocina a temperatura media vigilando el punto.\n3. Añade condimentos extras para realzar el sabor y sirve caliente.",
        macros_summary: "Macros Estimados: 350 kcal | Modificable basado en porciones exactas."
      });
    }
  } catch (err: any) {
    console.error("Error al llamar a Gemini API:", err);
    res.status(500).json({ error: "Fallo al conectar con Gemini para formular la receta. Verifica que hayas configurado la clave de API." });
  }
});

// ==========================================
// RUTA DE IA: PARSEAR TICKET/RECIBO DE COMPRA POR FOTO (Multimodal)
// ==========================================
app.post("/api/gemini/parse-ticket", async (req, res) => {
  const { base64Data, mimeType } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "No se proporcionó información de imagen en Base64." });
  }

  // Validar y descontar cuota mensual de IA
  if (!checkAndIncrementAiUsage()) {
    return res.status(429).json({ error: "Se ha alcanzado el límite mensual de consultas de Inteligencia Artificial para el escaneo de tickets." });
  }

  // Eliminar prefijo de data URI si existe ("data:image/png;base64,")
  const cleanedBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");

  const imagePart = {
    inlineData: {
      mimeType: mimeType || "image/jpeg",
      data: cleanedBase64,
    },
  };

  const textPart = {
    text: `Analiza esta foto de un ticket o recibo de compra de supermercado de forma ultra precisa. 
Extrae todos los alimentos, ingredientes y productos comprados que correspondan a una despensa.
Estima el nombre en un formato amigable para el usuario (por ejemplo, 'Pechugas de pollo' en lugar de 'PECH. POLL. 1KG').
Para cada ítem, extrae:
- name: Un nombre limpio adaptado (ej. 'Leche Semidesnatada')
- quantity: Cantidad numérica real (ej. 3 o 1.5)
- unit: Unidad estándar ('uds', 'g', 'kg', 'ml', 'litros')
- category: Elige estrictamente una de estas categorías: 'Verduras/Frutas', 'Carnes', 'Lácteos/Huevos', 'Granos/Cereales', 'Congelados', 'Despensa/Otros', 'Bebidas/Refrescos', 'Snacks/Dulces', 'Condimentos'.

Devuelve estrictamente un array JSON plano con la siguiente estructura (no rodees la respuesta con comillas adicionales o texto explicativo):
[
  { "name": "Nombre Alimento", "quantity": 2, "unit": "uds", "category": "Lácteos/Huevos" }
]
Asegúrate de responder estrictamente en español.`
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "quantity", "unit", "category"]
          }
        }
      }
    });

    const text = response.text ? response.text.trim() : "";
    if (!text) {
      throw new Error("Respuesta vacía al procesar el ticket.");
    }

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (parseErr) {
      console.error("Fallo al parsear respuesta de ticket:", text);
      res.status(500).json({ error: "No se pudo interpretar la estructura del ticket en JSON." });
    }
  } catch (err: any) {
    console.error("Error al procesar el ticket con Gemini:", err);
    res.status(500).json({ error: "Error de análisis multimodal con Gemini API." });
  }
});


// ==========================================
// RUTA DE IA: IMPORTAR RECETA DESDE TEXTO COPIADO O URL
// ==========================================
app.post("/api/gemini/parse-recipe-import", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || rawText.trim() === "") {
    return res.status(400).json({ error: "No se ha proporcionado texto o URL que analizar." });
  }

  // Validar y descontar cuota mensual de IA
  if (!checkAndIncrementAiUsage()) {
    return res.status(429).json({ error: "Se ha alcanzado el límite mensual de consultas de Inteligencia Artificial." });
  }

  const prompt = `Analiza el siguiente texto de receta o contenido web copiado y extáelo de forma estructurada para Despensia.
Contenido a analizar:
"${rawText}"

Devuelve la información estrictamente en formato JSON con la siguiente estructura:
{
  "title": "Título de la receta limpio",
  "ingredients_required": [
    { "name": "Nombre ingrediente", "quantity": "cantidad o número", "unit": "unidad estándar" }
  ],
  "instructions": "Pasos numerados de la receta detallando la elaboración.",
  "macros_summary": "Un resumen estimado de macros (ej. '420 kcal | Proteínas: 22g | Carbos: 40g | Grasas: 15g')"
}
Responde en español y asegúrate de retornar únicamente el objeto JSON válido.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients_required: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  unit: { type: Type.STRING }
                },
                required: ["name", "quantity", "unit"]
              }
            },
            instructions: { type: Type.STRING },
            macros_summary: { type: Type.STRING }
          },
          required: ["title", "ingredients_required", "instructions", "macros_summary"]
        }
      }
    });

    const text = response.text ? response.text.trim() : "";
    if (!text) throw new Error("Respuesta vacía");

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: any) {
    console.error("Error al analizar receta importada:", err);
    res.status(500).json({ error: "Error al interpretar la receta mediante IA." });
  }
});


// ==========================================
// RUTA DE IA: GENERAR ILUSTRACIÓN DE RECETA (Imagen)
// ==========================================
app.post("/api/gemini/generate-recipe-image", async (req, res) => {
  const { recipeTitle } = req.body;
  if (!recipeTitle) {
    return res.status(400).json({ error: "Falta el título de la receta para generar la ilustración." });
  }

  // Validar y descontar cuota mensual de IA
  if (!checkAndIncrementAiUsage()) {
    // Si la cuota expira, retornamos la imagen de placeholder directamente en lugar de fallar
    console.log("[AI LIMIT EXCEEDED] Retornando placeholder para ilustración debido a límite superado.");
    return res.json({ imageUrl: `https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80` });
  }

  // Generar la imagen usando el modelo predilecto por las guías: gemini-2.5-flash-image
  // que genera imágenes enviándole texto a través de generateContent.
  try {
    const prompt = `A studio-lit professional commercial food photography close up of ${recipeTitle}, beautiful colors, styled plate, highly appetizing, warm depth of field.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      throw new Error("No se devolvió un bloque de imagen base64 de Gemini.");
    }
  } catch (err: any) {
    console.error("Error al generar la imagen con Imagen/Gemini:", err);
    // URL de placeholder amigable si la generación de imágenes por cuotas de API falla/no está de pago
    res.json({ imageUrl: `https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80` });
  }
});


// ==========================================
// INTEGRACIÓN VITE CON EXPRESS: ENTORNO DEV & PRODUCCIÓN
// ==========================================
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf8");
        const envScript = `
  <script id="supabase-env-config">
    window._env_ = {
      NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "")},
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "")}
    };
  </script>
        `;
        html = html.replace("</head>", `${envScript}\n</head>`);
        res.send(html);
      } else {
        res.status(404).send("Index file not found");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Despensia] Server listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch(console.error);
