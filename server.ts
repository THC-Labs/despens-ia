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
  : (typeof import.meta !== "undefined" && import.meta?.url)
    ? fileURLToPath(import.meta.url)
    : "";
const runtimeDirname = typeof __dirname !== "undefined" 
  ? __dirname 
  : runtimeFilename 
    ? path.dirname(runtimeFilename) 
    : process.cwd();
const dbPath = process.env.VERCEL
  ? path.join("/tmp", "db.json")
  : path.join(runtimeDirname, "db.json");

// Función helper para obtener la instancia del cliente del SDK de Google GenAI
// con la cabecera correspondiente requerida por AI Studio Build.
// Se instancia de forma dinámica para asegurar que se obtengan las variables de entorno de Railway actualizadas.
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "MISSING_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("Clave de API de Gemini no configurada. Configura la variable GEMINI_API_KEY en tu entorno o panel de Railway.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Middleware para Vercel: restaurar la URL original desde x-matched-path si está disponible
app.use((req, res, next) => {
  const matchedPath = req.headers["x-matched-path"];
  if (matchedPath) {
    req.url = typeof matchedPath === "string" ? matchedPath : matchedPath[0];
  }
  next();
});

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

function checkAndIncrementDailyAiUsage(userId: string): { allowed: boolean; remaining: number; max: number } {
  try {
    const db = readDb();
    const today = new Date().toISOString().split("T")[0];

    if (!db.daily_ai_usage) {
      db.daily_ai_usage = {};
    }

    if (!db.daily_ai_usage[today]) {
      db.daily_ai_usage = { [today]: {} };
    }

    const isGuest = !userId || userId === "guest";
    const maxCalls = isGuest ? 1 : 4;

    const currentCount = db.daily_ai_usage[today][userId] || 0;

    if (currentCount >= maxCalls) {
      console.warn(`[DAILY LIMIT EXCEEDED] Límite diario de llamadas superado para ${userId} (${currentCount}/${maxCalls}) en ${today}`);
      return { allowed: false, remaining: 0, max: maxCalls };
    }

    db.daily_ai_usage[today][userId] = currentCount + 1;
    writeDb(db);

    console.log(`[DAILY LIMIT CHECK] Llamada registrada para ${userId}: ${currentCount + 1}/${maxCalls} para el día ${today}`);
    return { allowed: true, remaining: maxCalls - (currentCount + 1), max: maxCalls };
  } catch (err) {
    console.error("Error al comprobar o guardar el contador de cuota diaria de IA:", err);
    return { allowed: true, remaining: 1, max: 4 };
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
  
  // Buscar si hay imagen cacheada en el servidor para este título
  const normalizedTitle = (req.body.title || "").trim().toLowerCase();
  const cachedImage = db.images_cache?.find((img: any) => img.title === normalizedTitle);
  const coverUrl = req.body.cover_url || cachedImage?.imageUrl || "";

  const newRecipe = {
    id: "r_" + Math.random().toString(36).substring(2, 9),
    title: req.body.title,
    ingredients_required: req.body.ingredients_required || [],
    instructions: req.body.instructions,
    macros_summary: req.body.macros_summary || "",
    likes: 0,
    cover_url: coverUrl,
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

app.put("/api/recipes/:id", (req, res) => {
  const db = readDb();
  const idx = db.recipes.findIndex((r: any) => r.id === req.params.id);
  if (idx > -1) {
    db.recipes[idx] = {
      ...db.recipes[idx],
      title: req.body.title !== undefined ? req.body.title : db.recipes[idx].title,
      ingredients_required: req.body.ingredients_required !== undefined ? req.body.ingredients_required : db.recipes[idx].ingredients_required,
      instructions: req.body.instructions !== undefined ? req.body.instructions : db.recipes[idx].instructions,
      macros_summary: req.body.macros_summary !== undefined ? req.body.macros_summary : db.recipes[idx].macros_summary,
      cover_url: req.body.cover_url !== undefined ? req.body.cover_url : db.recipes[idx].cover_url,
      likes: req.body.likes !== undefined ? req.body.likes : db.recipes[idx].likes
    };
    writeDb(db);
    res.json(db.recipes[idx]);
  } else {
    res.status(404).json({ error: "Receta no encontrada" });
  }
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


app.get("/api/gemini/test", async (req, res) => {
  const key = process.env.GEMINI_API_KEY || "";
  const info = {
    envKeyExists: !!key,
    envKeyLength: key.length,
    envKeyPrefix: key ? key.substring(0, 10) + "..." : "NONE",
    simpleCallResult: "",
    schemaCallResult: "",
    modelNameUsed: MODEL_NAME,
  };

  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Responde con la palabra 'Hola'",
    });
    info.simpleCallResult = `ÉXITO: ${response.text ? response.text.trim() : "Respuesta vacía"}`;
  } catch (err: any) {
    info.simpleCallResult = `FALLO: ${err.message || err.toString()}`;
  }

  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Genera un objeto JSON de prueba con un título cualquiera en español.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
          },
          required: ["title"],
        },
      },
    });
    info.schemaCallResult = `ÉXITO: ${response.text ? response.text.trim() : "Respuesta vacía"}`;
  } catch (err: any) {
    info.schemaCallResult = `FALLO: ${err.message || err.toString()}`;
  }

  res.json(info);
});


// ==========================================
// RUTA DE IA: GENERAR RECETA CON GEMINI
// ==========================================
app.post("/api/gemini/recipe", async (req, res) => {
  const { 
    selectedIngredients, 
    extraPrompt, 
    allergies, 
    preferences, 
    cookingStyle, 
    forceRegenerate, 
    useOnlyPantryIngredients, 
    prioritizeExpiringIngredients,
    action, // "propose" o "expand"
    selectedProposal, // la propuesta elegida al expandir
    macroTargets, // { calories, protein, carbs, fat }
    userId // Identificador de usuario para cuota diaria
  } = req.body;
  
  console.log(`[Gemini Recipe] Ingredientes recibidos (Acción: ${action || "directa"}):`, JSON.stringify(selectedIngredients));
  console.log("[Gemini Recipe] Preferencias y objetivos:", { allergies, preferences, cookingStyle, forceRegenerate, useOnlyPantryIngredients, prioritizeExpiringIngredients, macroTargets, userId });

  if (!selectedIngredients || selectedIngredients.length === 0) {
    return res.status(400).json({ error: "No seleccionaste ningún ingrediente de tu despensa." });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ingredientsListStr = selectedIngredients.map((item: any) => {
    let tag = "";
    if (prioritizeExpiringIngredients && item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        tag = " [PRÓXIMO A CADUCAR]";
      }
    }
    return `- ${item.name} (${item.quantity} ${item.unit})${tag}`;
  }).join("\n");

  const allergiesStr = allergies && allergies.length > 0 ? allergies.join(", ") : "Ninguna";
  const preferencesStr = preferences && preferences.length > 0 ? preferences.join(", ") : "Ninguna";
  const cookingStyleStr = cookingStyle || "Saludable y Balanceada";

  // Formatear objetivos de macros para el prompt
  const hasMacroTargets = macroTargets && (macroTargets.calories || macroTargets.protein || macroTargets.carbs || macroTargets.fat);
  const macroTargetsPromptStr = hasMacroTargets 
    ? `Objetivos Nutricionales Diarios Deseados por el Usuario para esta receta:
- Calorías: ${macroTargets.calories ? `~${macroTargets.calories} kcal` : "Sin especificar"}
- Proteínas: ${macroTargets.protein ? `~${macroTargets.protein} g` : "Sin especificar"}
- Carbohidratos: ${macroTargets.carbs ? `~${macroTargets.carbs} g` : "Sin especificar"}
- Grasas: ${macroTargets.fat ? `~${macroTargets.fat} g` : "Sin especificar"}
Asegúrate de ajustar los ingredientes y las porciones para intentar aproximarte lo mejor posible a estos valores indicados.`
    : "Sin objetivos nutricionales específicos (hazla equilibrada).";

  // Generar clave única para la caché
  const sortedNames = [...selectedIngredients]
    .map((item: any) => `${item.name.trim().toLowerCase()}:${item.quantity}${item.unit}`)
    .sort()
    .join("|");
  
  const macroTargetsKeyStr = macroTargets 
    ? `cal:${macroTargets.calories || 0};prot:${macroTargets.protein || 0};carb:${macroTargets.carbs || 0};fat:${macroTargets.fat || 0}` 
    : "no-macros";

  let cacheKeyInput = "";
  if (action === "propose") {
    cacheKeyInput = `action:propose;ingredients:${sortedNames};allergies:${allergiesStr.toLowerCase()};preferences:${preferencesStr.toLowerCase()};style:${cookingStyleStr.toLowerCase()};extra:${(extraPrompt || "").trim().toLowerCase()};onlyPantry:${!!useOnlyPantryIngredients};prioritizeExpiring:${!!prioritizeExpiringIngredients};macros:${macroTargetsKeyStr}`;
  } else if (action === "expand") {
    const propTitle = selectedProposal?.title || "";
    cacheKeyInput = `action:expand;title:${propTitle.toLowerCase()};ingredients:${sortedNames};allergies:${allergiesStr.toLowerCase()};preferences:${preferencesStr.toLowerCase()};style:${cookingStyleStr.toLowerCase()};extra:${(extraPrompt || "").trim().toLowerCase()};macros:${macroTargetsKeyStr}`;
  } else {
    // Antigua acción directa
    cacheKeyInput = `ingredients:${sortedNames};allergies:${allergiesStr.toLowerCase()};preferences:${preferencesStr.toLowerCase()};style:${cookingStyleStr.toLowerCase()};extra:${(extraPrompt || "").trim().toLowerCase()};onlyPantry:${!!useOnlyPantryIngredients};prioritizeExpiring:${!!prioritizeExpiringIngredients}`;
  }

  const cacheKey = crypto.createHash("md5").update(cacheKeyInput).digest("hex");

  const db = readDb();
  if (!db.recipes_cache) {
    db.recipes_cache = [];
  }

  // Comprobar caché si no es forzada
  if (!forceRegenerate) {
    const cached = db.recipes_cache.find((item: any) => item.key === cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] Retornando de caché para key: ${cacheKey}`);
      return res.json({ ...cached.recipe, _cached: true });
    }
  }

  // Validar cuotas de IA (mensual y diaria)
  if (action !== "expand") {
    // 1. Validar cuota mensual global primero
    if (!checkAndIncrementAiUsage()) {
      return res.status(429).json({
        error: "limit_reached",
        message: "Se ha alcanzado el límite mensual de consultas de Inteligencia Artificial para la aplicación."
      });
    }

    // 2. Validar cuota diaria por cuenta / IP
    const uId = userId || "guest";
    const dailyCheck = checkAndIncrementDailyAiUsage(uId);
    if (!dailyCheck.allowed) {
      return res.status(429).json({
        error: "daily_limit_reached",
        message: `Has alcanzado el límite diario de recetas generadas por IA (${dailyCheck.max} para tu cuenta). Puedes exportar el prompt para usar tu propio LLM.`,
        limit: dailyCheck.max,
        used: dailyCheck.max
      });
    }
  } else {
    // Para expandir, solo validamos la cuota mensual general
    if (!checkAndIncrementAiUsage()) {
      return res.status(429).json({
        error: "limit_reached",
        message: "Se ha alcanzado el límite mensual de consultas de Inteligencia Artificial para la aplicación."
      });
    }
  }

  try {
    const ai = getGenAIClient();

    if (action === "propose") {
      // ==========================================
      // CASO A: GENERAR 3 PROPUESTAS DE RECETA
      // ==========================================
      const prompt = `Actúa como un chef profesional y diseñador de menús interactivos.
Tengo los siguientes ingredientes disponibles en mi despensa:
${ingredientsListStr}

Restricciones y Preferencias:
- Alergias/Intolerancias: ${allergiesStr}. EXCLUYE estrictamente estos alérgenos de todas las propuestas.
- Preferencias de dieta: ${preferencesStr}.
- Estilo de cocina: ${cookingStyleStr}.
${extraPrompt ? `- Comentarios adicionales del usuario: "${extraPrompt}"` : ""}

${macroTargetsPromptStr}

Propón exactamente 3 opciones de recetas deliciosas, creativas y diferentes que se puedan hacer con estos ingredientes.
Debes clasificar cada una de las 3 opciones bajo una de estas categorías obligatoriamente:
1. "aprovechamiento": Una receta rápida y directa que use exclusivamente o casi en su totalidad los ingredientes que ya tengo en la despensa.
   - Tagline descriptivo: "Rápida con lo que tienes"
   - missingIngredients: Debe ser una lista vacía [].
2. "supermercado": Una receta que aproveche los ingredientes en despensa, pero recomiende añadir 2 o 3 ingredientes clave que no tengo (por ejemplo, sugiriendo comprar nata, jengibre o pollo si faltaran).
   - Tagline descriptivo: "¿Tienes tiempo para ir al súper? haz esto"
   - missingIngredients: Lista de 1 a 3 ingredientes principales a comprar.
3. "innovar": Una receta creativa, exótica o con un giro divertido. Puede ser un estilo de preparación inusual o combinación de sabores novedosa, usando los ingredientes de la despensa y opcionalmente sugiriendo 1 o 2 ingredientes extra si hicieran falta para el toque Gourmet.
   - Tagline descriptivo: "¿Quieres innovar? prueba esto"
   - missingIngredients: Lista opcional de ingredientes extra que aportarían ese toque innovador (pueden ser condimentos, salsas o complementos).

Devuelve la respuesta estrictamente en un array JSON plano con 3 objetos con la siguiente estructura exacta:
[
  {
    "type": "aprovechamiento" | "supermercado" | "innovar",
    "tagline": "Rápida con lo que tienes" | "¿Tienes tiempo para ir al súper? haz esto" | "¿Quieres innovar? prueba esto",
    "title": "Nombre creativo de la receta",
    "description": "Una breve descripción de 1-2 frases atractivas en español explicando en qué consiste y por qué vale la pena.",
    "missingIngredients": ["Ingrediente faltante 1", "Ingrediente faltante 2"]
  }
]`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                tagline: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                missingIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["type", "tagline", "title", "description", "missingIngredients"]
            }
          }
        }
      });

      const bodyText = response.text ? response.text.trim() : "";
      if (!bodyText) throw new Error("Respuesta vacía al generar propuestas.");
      
      const parsed = JSON.parse(bodyText);

      // Guardar en la caché local del servidor
      const dbUpdate = readDb();
      if (!dbUpdate.recipes_cache) dbUpdate.recipes_cache = [];
      dbUpdate.recipes_cache.push({
        key: cacheKey,
        recipe: { proposals: parsed },
        created_at: new Date().toISOString()
      });
      writeDb(dbUpdate);

      return res.json({ proposals: parsed });

    } else if (action === "expand") {
      // ==========================================
      // CASO B: EXPANDIR PROPUESTA ELEGIDA A RECETA COMPLETA
      // ==========================================
      const { title, type, tagline, description, missingIngredients } = selectedProposal;
      
      const prompt = `Actúa como un chef profesional y redactor de recetarios detallados.
El usuario ha elegido expandir la siguiente propuesta de receta:
- Título: ${title}
- Tipo de propuesta: ${type} (${tagline})
- Descripción inicial: ${description}
- Ingredientes a comprar sugeridos (si aplica): ${missingIngredients && missingIngredients.length > 0 ? missingIngredients.join(", ") : "Ninguno"}

Ingredientes que el usuario tiene disponibles en su despensa:
${ingredientsListStr}

Restricciones y Preferencias de Salud/Dieta del Usuario:
- Alergias/Intolerancias alimenticias: ${allergiesStr}. EXCLUYE estrictamente estos alérgenos de la receta.
- Preferencias de gustos/ingredientes: ${preferencesStr}.
- Estilo de cocina deseado: ${cookingStyleStr}.
${macroTargetsPromptStr}

Crea la receta detallada completa para "${title}".
Debes asumir que el usuario tiene o comprará los ingredientes faltantes listados en la propuesta, por lo que deben figurar en la lista final de ingredientes requeridos.

Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "title": "Nombre definitivo de la receta en español",
  "ingredients_required": [
    {"name": "Nombre exacto del ingrediente", "quantity": "cantidad (ej: 250, 2, al gusto)", "unit": "unidad (ej: g, uds, ml, cucharadas)"}
  ],
  "instructions": "Instrucciones de preparación numeradas y claras paso a paso. Sé detallado y profesional en la explicación.",
  "macros_summary": "Resumen estimado de macros (ej: '510 kcal | Proteínas: 32g | Carbohidratos: 45g | Grasas: 18g')"
}
Responde en español y devuelve exclusivamente el objeto JSON válido.`;

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
      if (!bodyText) throw new Error("Respuesta vacía al expandir propuesta.");

      const parsed = JSON.parse(bodyText);

      // Guardar en la caché local del servidor
      const dbUpdate = readDb();
      if (!dbUpdate.recipes_cache) dbUpdate.recipes_cache = [];
      dbUpdate.recipes_cache.push({
        key: cacheKey,
        recipe: parsed,
        created_at: new Date().toISOString()
      });
      writeDb(dbUpdate);

      return res.json(parsed);

    } else {
      // ==========================================
      // CASO C: COMPATIBILIDAD ANTERIOR (DIRECTA)
      // ==========================================
      const prompt = `Actúa como un chef profesional y diseñador de planes alimenticios saludables.
Tengo los siguientes ingredientes disponibles en mi despensa:
${ingredientsListStr}

Restricciones y Preferencias de Salud/Dieta del Usuario:
- Alergias/Intolerancias alimenticias: ${allergiesStr}. EXCLUYE estrictamente estos alérgenos e intolerancias de la receta.
- Preferencias de gustos/ingredientes: ${preferencesStr}.
- Estilo de cocina deseado: ${cookingStyleStr}.
${extraPrompt ? `Instrucciones o preferencias adicionales del usuario: "${extraPrompt}"` : ""}

  ${useOnlyPantryIngredients ? `REGLA DE ORO CRÍTICA: La receta debe contener EXCLUSIVAMENTE los ingredientes listados arriba de tu despensa. No agregues ningún otro ingrediente, condimento, especia o grasa (como aceite) que no figure en la lista (puedes asumir únicamente agua y sal común si son indispensables para la preparación, pero nada más).` : ""}
  ${prioritizeExpiringIngredients ? `REGLA DE REAPROVECHAMIENTO CRÍTICA: Los ingredientes listados arriba que tienen la marca "[PRÓXIMO A CADUCAR]" están muy cerca de vencer. Debes priorizar el uso obligatorio de estos ingredientes en la receta para evitar el desperdicio.` : ""}

  Crea una receta deliciosa, creativa y balanceada utilizando todos o algunos de estos ingredientes. 
  Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "title": "Nombre creativo e inspirador de la receta (en español)",
  "ingredients_required": [
    {"name": "Nombre de ingrediente", "quantity": "cantidad", "unit": "unidad"}
  ],
  "instructions": "Instrucciones numeradas en pasos claros y concisos (ejemplo: '1. Calentar sartén... \\n2. Añadir verduras...').",
  "macros_summary": "Un resumen estimado de macros como '420 kcal | Proteínas: 28g | Carbohidratos: 45g | Grasas: 14g'"
}
Responde en español y devuelve directamente el objeto JSON válido.`;

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
      if (!bodyText) throw new Error("Respuesta vacía de Gemini.");

      const parsed = JSON.parse(bodyText);

      // Guardar en la caché local
      const dbUpdate = readDb();
      if (!dbUpdate.recipes_cache) dbUpdate.recipes_cache = [];
      dbUpdate.recipes_cache.push({
        key: cacheKey,
        recipe: parsed,
        created_at: new Date().toISOString()
      });
      writeDb(dbUpdate);

      return res.json(parsed);
    }
  } catch (err: any) {
    console.error("Error al llamar a Gemini API:", err);
    res.status(500).json({ 
      error: "Fallo al conectar con Gemini para formular la receta. Verifica que hayas configurado la clave de API.",
      details: err.message || err.toString()
    });
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
- estimated_shelf_life_days: Estima la cantidad de días que dura este producto fresco antes de caducar a partir de hoy (ej. verduras frescas: 7, carne: 3, huevos: 14, leche: 7, arroz: 365, condimentos/conservas: 360). Sé conservador.

Devuelve estrictamente un array JSON plano con la siguiente estructura (no rodees la respuesta con comillas adicionales o texto explicativo):
[
  { "name": "Nombre Alimento", "quantity": 2, "unit": "uds", "category": "Lácteos/Huevos", "estimated_shelf_life_days": 7 }
]
Asegúrate de responder estrictamente en español.`
  };

  try {
    const response = await getGenAIClient().models.generateContent({
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
              category: { type: Type.STRING },
              estimated_shelf_life_days: { type: Type.NUMBER }
            },
            required: ["name", "quantity", "unit", "category", "estimated_shelf_life_days"]
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
    res.status(500).json({ 
      error: "Error de análisis multimodal con Gemini API.",
      details: err.message || err.toString()
    });
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
    const response = await getGenAIClient().models.generateContent({
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
    res.status(500).json({ 
      error: "Error al interpretar la receta mediante IA.",
      details: err.message || err.toString()
    });
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

  const db = readDb();
  if (!db.images_cache) {
    db.images_cache = [];
  }

  // Buscar en caché por título (normalizado)
  const normalizedTitle = recipeTitle.trim().toLowerCase();
  const cachedImage = db.images_cache.find((img: any) => img.title === normalizedTitle);
  if (cachedImage) {
    console.log(`[IMAGE CACHE HIT] Retornando imagen guardada en caché para: ${normalizedTitle}`);
    return res.json({ imageUrl: cachedImage.imageUrl });
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
    
    const response = await getGenAIClient().models.generateContent({
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
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      // Guardar en la caché local del servidor
      db.images_cache.push({
        title: normalizedTitle,
        imageUrl: imageUrl,
        created_at: new Date().toISOString()
      });
      writeDb(db);

      res.json({ imageUrl: imageUrl });
    } else {
      throw new Error("No se devolvió un bloque de imagen base64 de Gemini.");
    }
  } catch (err: any) {
    console.error("Error al generar la imagen con Imagen/Gemini:", err);
    // URL de placeholder amigable si la generación de imágenes por cuotas de API falla/no está de pago
    res.json({ imageUrl: `https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80` });
  }
});

app.get("/api/gemini/usage-status", (req, res) => {
  const userId = (req.query.userId as string) || "guest";
  const db = readDb();
  const today = new Date().toISOString().split("T")[0];
  
  if (!db.daily_ai_usage) {
    db.daily_ai_usage = {};
  }
  
  const isGuest = !userId || userId === "guest";
  const max = isGuest ? 1 : 4;
  
  const used = (db.daily_ai_usage[today] && db.daily_ai_usage[today][userId]) || 0;
  
  res.json({
    used: used,
    limit: max,
    remaining: Math.max(0, max - used)
  });
});

app.get("/api/gemini/recipe-covers", (req, res) => {
  const db = readDb();
  const cache = db.images_cache || [];
  const map: Record<string, string> = {};
  for (const entry of cache) {
    if (entry.title && entry.imageUrl) {
      map[entry.title.trim().toLowerCase()] = entry.imageUrl;
    }
  }
  res.json(map);
});


// ==========================================
// INTEGRACIÓN VITE CON EXPRESS: ENTORNO DEV & PRODUCCIÓN
// ==========================================
async function main() {
  // Validación de clave de API al iniciar el servidor
  const key = process.env.GEMINI_API_KEY || "";
  console.log(`[Gemini Config] Clave cargada: ${key ? "SÍ" : "NO"} (Longitud: ${key.length}${key ? `, Prefijo: ${key.substring(0, 10)}...` : ""})`);

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

if (!process.env.VERCEL) {
  main().catch(console.error);
}

export default app;
