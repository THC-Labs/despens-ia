/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./lib/supabase";
import { MacroGoals, Macros } from "./types/database";
import MealPlannerTab from "./components/MealPlannerTab";
import LiveCookingModal from "./components/LiveCookingModal";
import TicketScannerModal from "./components/TicketScannerModal";
import {
  CookingPot,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChefHat,
  Sparkles,
  Camera,
  Play,
  Check,
  Timer,
  Pause,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  Upload,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Utensils,
  Maximize2,
  Minus,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  Cloud,
  CloudOff,
  Lock,
  User,
  Mail,
  Smartphone,
  Warehouse,
  ChevronDown,
  Settings
} from "lucide-react";

// Categorías del inventario
const CATEGORIES = [
  "Verduras/Frutas",
  "Carnes",
  "Pescados/Mariscos",
  "Lácteos/Huevos",
  "Granos/Cereales",
  "Bebidas/Refrescos",
  "Snacks/Dulces",
  "Condimentos",
  "Otros"
];

const STANDARD_DAYS = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

const MEAL_TYPES = ["Desayuno", "Comida", "Cena", "Snack"];



// Parsea macros desde strings (ej. "380 kcal | P: 32g | C: 12g | G: 18g")
function parseMacros(summary: string | null | undefined): Macros {
  const macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!summary) return macros;

  // Calorías
  const calMatch = summary.match(/(\d+(?:\.\d+)?)\s*k?cal/i);
  if (calMatch) macros.calories = Math.round(parseFloat(calMatch[1]));

  // Proteínas
  const protMatch1 = summary.match(/(?:p|proteinas?|protein|prot)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const protMatch2 = summary.match(/(\d+(?:\.\d+)?)\s*g\s*(?:p|proteinas?|protein|prot)/i);
  if (protMatch1) macros.protein = Math.round(parseFloat(protMatch1[1]));
  else if (protMatch2) macros.protein = Math.round(parseFloat(protMatch2[1]));

  // Carbohidratos
  const carbMatch1 = summary.match(/(?:c|carbohidratos?|carbos?|carbo|carbs?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const carbMatch2 = summary.match(/(\d+(?:\.\d+)?)\s*g\s*(?:c|carbohidratos?|carbos?|carbo|carbs?)/i);
  if (carbMatch1) macros.carbs = Math.round(parseFloat(carbMatch1[1]));
  else if (carbMatch2) macros.carbs = Math.round(parseFloat(carbMatch2[1]));

  // Grasas
  const fatMatch1 = summary.match(/(?:g|grasas?|grasa|f|fats?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const fatMatch2 = summary.match(/(\d+(?:\.\d+)?)\s*g\s*(?:g|grasas?|grasa|f|fats?)/i);
  if (fatMatch1) macros.fat = Math.round(parseFloat(fatMatch1[1]));
  else if (fatMatch2) macros.fat = Math.round(parseFloat(fatMatch2[1]));

  return macros;
}

// Formatea fecha a YYYY-MM-DD en hora local
function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Devuelve los 7 objetos Date de la semana que contiene a la fecha dada (Lunes a Domingo)
function getWeekDates(date: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    dates.push(next);
  }
  return dates;
}

const MONTH_NAMES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getWeekDayNameEs(date: Date): string {
  return DAY_NAMES_ES[(date.getDay() + 6) % 7];
}

function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_ES[date.getMonth()]}`;
}

// Auto-clasificador de categorías basado en palabras clave del nombre en español
function suggestCategoryByName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (!lower) return "Otros";

  // 1. Verduras/Frutas
  const fruitsVegs = [
    "tomate", "lechuga", "zanahoria", "cebolla", "ajo", "patata", "papa", "pimiento", "pepino", "espinaca", "brocoli",
    "calabacin", "berenjena", "seta", "champiñ", "aguacate", "limon", "naranja", "platano", "manzana", "fresa", "uvas",
    "pera", "piña", "kiwi", "melon", "sandia", "fruta", "verdura", "ensalada", "judio", "alubia", "apio", "puerro",
    "calabaza", "durazno", "melocoton", "ciruela", "cereza", "mango", "arandano", "frambuesa", "mora"
  ];
  if (fruitsVegs.some(k => lower.includes(k))) return "Verduras/Frutas";

  // 2. Carnes
  const meats = [
    "pollo", "ternera", "cerdo", "pavo", "lomo", "jamon", "salchicha", "hamburguesa", "filete", "bacon", "beicon",
    "carne", "costilla", "cordero", "pato", "conejo", "embutido", "chorizo", "salami", "salchichon", "pate", "foie",
    "pechuga"
  ];
  if (meats.some(k => lower.includes(k))) return "Carnes";

  // 3. Pescados/Mariscos
  const fish = [
    "salmon", "atun", "merluza", "bacalao", "sardina", "langostino", "gamba", "pulpo", "calamar", "mejillon", "almeja",
    "pescado", "marisco", "trucha", "lubina", "dorada", "cangrejo", "bonito", "emperador", "pescadilla"
  ];
  if (fish.some(k => lower.includes(k))) return "Pescados/Mariscos";

  // 4. Lácteos/Huevos
  const dairy = [
    "leche", "queso", "yogur", "mantequilla", "nata", "huevo", "crema", "flan", "cuajada", "kefir", "lacteo", "margarina"
  ];
  if (dairy.some(k => lower.includes(k))) return "Lácteos/Huevos";

  // 5. Granos/Cereales
  const grains = [
    "arroz", "pan", "pasta", "macarron", "tallarin", "espagueti", "cereal", "avena", "harina", "legumbre", "lenteja",
    "garbanzo", "trigo", "maiz", "quinoa", "galleta", "tostada"
  ];
  if (grains.some(k => lower.includes(k))) return "Granos/Cereales";

  // 6. Bebidas/Refrescos
  const drinks = [
    "agua", "refresco", "coca", "fanta", "zumo", "jugo", "cerveza", "vino", "cava", "sidra", "licor", "bebida", "soda",
    "tonica", "te", "infusion", "cafe"
  ];
  if (drinks.some(k => lower.includes(k))) return "Bebidas/Refrescos";

  // 7. Snacks/Dulces
  const sweets = [
    "chocolate", "patatas fritas", "snack", "gominola", "chuche", "caramelo", "bombon", "helado", "palomitas", "fruto seco",
    "nuez", "almendra", "pistacho", "cacahuete", "avellana", "tarta", "pastel", "bollo", "donut", "croissant"
  ];
  if (sweets.some(k => lower.includes(k))) return "Snacks/Dulces";

  // 8. Condimentos
  const condiments = [
    "sal", "pimienta", "aceite", "vinagre", "mayonesa", "ketchup", "mostaza", "salsa", "especia", "oregano", "perejil",
    "romero", "tomillo", "curry", "comino", "pimenton", "colorante", "caldo", "avecrem", "azucar", "miel"
  ];
  if (condiments.some(k => lower.includes(k))) return "Condimentos";

  return "Otros";
}

// Tickets de ejemplo codificados en Base64 de forma abreviada para simulación y pruebas directas
const SAMPLE_TICKET_MERCADONA = {
  name: "Ticket Mercadona (Pollo y Tomates)",
  items: [
    { name: "Pechuga de Pollo", quantity: 500, unit: "g", category: "Carnes", estimated_shelf_life_days: 3 },
    { name: "Tomates frescos", quantity: 6, unit: "uds", category: "Verduras/Frutas", estimated_shelf_life_days: 6 },
    { name: "Huevos Orgánicos", quantity: 12, unit: "uds", category: "Lácteos/Huevos", estimated_shelf_life_days: 14 },
    { name: "Arroz Integral", quantity: 1000, unit: "g", category: "Granos/Cereales", estimated_shelf_life_days: 365 }
  ]
};

const SAMPLE_TICKET_CARREFOUR = {
  name: "Ticket Carrefour (Aguacate y Lácteos)",
  items: [
    { name: "Aguacate Maduro", quantity: 4, unit: "uds", category: "Verduras/Frutas", estimated_shelf_life_days: 4 },
    { name: "Leche Semidesnatada", quantity: 1000, unit: "ml", category: "Lácteos/Huevos", estimated_shelf_life_days: 7 },
    { name: "Queso Fresco", quantity: 250, unit: "g", category: "Lácteos/Huevos", estimated_shelf_life_days: 5 },
    { name: "Espinacas frescas", quantity: 300, unit: "g", category: "Verduras/Frutas", estimated_shelf_life_days: 4 }
  ]
};

const ALLERGY_OPTIONS = [
  { id: "Gluten", label: "Sin Gluten", emoji: "🌾" },
  { id: "Lactosa", label: "Sin Lactosa", emoji: "🥛" },
  { id: "FrutosSecos", label: "Frutos Secos", emoji: "🥜" },
  { id: "Huevo", label: "Sin Huevo", emoji: "🥚" },
  { id: "Mariscos", label: "Mariscos", emoji: "🦐" },
  { id: "Pescado", label: "Sin Pescado", emoji: "🐟" },
  { id: "Soja", label: "Sin Soja", emoji: "🌱" },
  { id: "Apio", label: "Sin Apio", emoji: "🥬" },
  { id: "Mostaza", label: "Sin Mostaza", emoji: "🌭" },
  { id: "Sesamo", label: "Sin Sésamo", emoji: "🥯" },
  { id: "Altramuces", label: "Altramuces", emoji: "🌰" },
  { id: "Moluscos", label: "Moluscos", emoji: "🐙" },
  { id: "Vegano", label: "Vegano", emoji: "🥗" },
  { id: "Vegetariano", label: "Vegetariano", emoji: "🥕" },
  { id: "Keto", label: "Dieta Keto", emoji: "🥩" }
];

const STYLE_OPTIONS = [
  { id: "Rápida y Fácil", label: "Rápida y Fácil (< 20 min)", desc: "Platos rápidos con pocos ingredientes", emoji: "⚡" },
  { id: "Saludable y Fitness", label: "Saludable y Fitness", desc: "Platos balanceados, control de macros", emoji: "🥗" },
  { id: "Familiar y Tradicional", label: "Familiar y Tradicional", desc: "Guisos, guarniciones y cocina clásica", emoji: "🍳" },
  { id: "Gourmet y Creativo", label: "Gourmet y Creativo", desc: "Platos elaborados con técnicas culinarias", emoji: "👨‍🍳" }
];

const BASIC_INGREDIENT_OPTIONS = [
  // Condimentos
  { name: "Aceite de Oliva", quantity: 1000, unit: "ml", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  { name: "Sal", quantity: 500, unit: "g", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  { name: "Pimienta Negra", quantity: 100, unit: "g", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  { name: "Ajo en Polvo", quantity: 100, unit: "g", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  { name: "Orégano seco", quantity: 80, unit: "g", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  { name: "Vinagre", quantity: 500, unit: "ml", category: "Condimentos", categoryGroup: "Especias & Aceites" },
  
  // Secos
  { name: "Arroz Integral", quantity: 1000, unit: "g", category: "Granos/Cereales", categoryGroup: "Granos & Secos" },
  { name: "Pasta de Trigo", quantity: 500, unit: "g", category: "Granos/Cereales", categoryGroup: "Granos & Secos" },
  { name: "Harina de Trigo", quantity: 1000, unit: "g", category: "Granos/Cereales", categoryGroup: "Granos & Secos" },
  { name: "Avena en copos", quantity: 500, unit: "g", category: "Granos/Cereales", categoryGroup: "Granos & Secos" },
  { name: "Café molido", quantity: 250, unit: "g", category: "Otros", categoryGroup: "Granos & Secos" },
  { name: "Azúcar", quantity: 500, unit: "g", category: "Otros", categoryGroup: "Granos & Secos" },
  
  // Frescos
  { name: "Huevos Orgánicos", quantity: 12, unit: "uds", category: "Lácteos/Huevos", categoryGroup: "Frescos Básicos" },
  { name: "Cebollas", quantity: 4, unit: "uds", category: "Verduras/Frutas", categoryGroup: "Frescos Básicos" },
  { name: "Ajos", quantity: 3, unit: "uds", category: "Verduras/Frutas", categoryGroup: "Frescos Básicos" },
  { name: "Patatas", quantity: 1000, unit: "g", category: "Verduras/Frutas", categoryGroup: "Frescos Básicos" },
  { name: "Limón", quantity: 3, unit: "uds", category: "Verduras/Frutas", categoryGroup: "Frescos Básicos" }
];

// Mapas de temas de colores
const themeColorMaps: Record<string, {
  primary: string;
  hover: string;
  active: string;
  light: string;
  border: string;
  borderLight: string;
  darkText: string;
  ultraDarkText: string;
  badgeBg: string;
  badgeText: string;
  glow500: string;
  accent: string;
  fromGrad: string;
  toGrad: string;
  fromGradLight: string;
  toGradLight: string;
  textSparkle: string;
  bgDarkBadge: string;
  borderDarkBadge: string;
  textDarkBadge: string;
  shadowColor: string;
}> = {
  emerald: {
    primary: "#059669",
    hover: "#10b981",
    active: "#047857",
    light: "#ecfdf5",
    border: "#10b981",
    borderLight: "#d1fae5",
    darkText: "#065f46",
    ultraDarkText: "#022c22",
    badgeBg: "#d1fae5",
    badgeText: "#065f46",
    glow500: "#10b981",
    accent: "#059669",
    fromGrad: "#059669",
    toGrad: "#0f766e",
    fromGradLight: "#34d399",
    toGradLight: "#5eead4",
    textSparkle: "#34d399",
    bgDarkBadge: "#022c22",
    borderDarkBadge: "#065f46",
    textDarkBadge: "#34d399",
    shadowColor: "6, 95, 70"
  },
  amber: {
    primary: "#d97706",
    hover: "#f59e0b",
    active: "#b45309",
    light: "#fffbeb",
    border: "#f59e0b",
    borderLight: "#fef3c7",
    darkText: "#92400e",
    ultraDarkText: "#451a03",
    badgeBg: "#fef3c7",
    badgeText: "#92400e",
    glow500: "#f59e0b",
    accent: "#d97706",
    fromGrad: "#d97706",
    toGrad: "#c2410c",
    fromGradLight: "#fbbf24",
    toGradLight: "#fde047",
    textSparkle: "#fbbf24",
    bgDarkBadge: "#451a03",
    borderDarkBadge: "#92400e",
    textDarkBadge: "#fbbf24",
    shadowColor: "146, 64, 14"
  },
  rose: {
    primary: "#e11d48",
    hover: "#f43f5e",
    active: "#be123c",
    light: "#fff1f2",
    border: "#f43f5e",
    borderLight: "#ffe4e6",
    darkText: "#9f1239",
    ultraDarkText: "#4c0519",
    badgeBg: "#ffe4e6",
    badgeText: "#9f1239",
    glow500: "#f43f5e",
    accent: "#e11d48",
    fromGrad: "#e11d48",
    toGrad: "#be123c",
    fromGradLight: "#fb7185",
    toGradLight: "#fca5a5",
    textSparkle: "#fb7185",
    bgDarkBadge: "#4c0519",
    borderDarkBadge: "#9f1239",
    textDarkBadge: "#fb7185",
    shadowColor: "159, 18, 57"
  },
  indigo: {
    primary: "#4f46e5",
    hover: "#6366f1",
    active: "#3730a3",
    light: "#eef2ff",
    border: "#6366f1",
    borderLight: "#e0e7ff",
    darkText: "#3730a3",
    ultraDarkText: "#312e81",
    badgeBg: "#e0e7ff",
    badgeText: "#3730a3",
    glow500: "#6366f1",
    accent: "#4f46e5",
    fromGrad: "#4f46e5",
    toGrad: "#4338ca",
    fromGradLight: "#818cf8",
    toGradLight: "#a5b4fc",
    textSparkle: "#818cf8",
    bgDarkBadge: "#1e1b4b",
    borderDarkBadge: "#3730a3",
    textDarkBadge: "#818cf8",
    shadowColor: "55, 48, 163"
  },
  violet: {
    primary: "#7c3aed",
    hover: "#8b5cf6",
    active: "#6d28d9",
    light: "#f5f3ff",
    border: "#8b5cf6",
    borderLight: "#ede9fe",
    darkText: "#5b21b6",
    ultraDarkText: "#2e1065",
    badgeBg: "#ede9fe",
    badgeText: "#5b21b6",
    glow500: "#8b5cf6",
    accent: "#7c3aed",
    fromGrad: "#7c3aed",
    toGrad: "#6d28d9",
    fromGradLight: "#a78bfa",
    toGradLight: "#c4b5fd",
    textSparkle: "#a78bfa",
    bgDarkBadge: "#2e1065",
    borderDarkBadge: "#5b21b6",
    textDarkBadge: "#a78bfa",
    shadowColor: "91, 33, 182"
  }
};

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

const getThemeStylesheet = (themeName: string) => {
  const map = themeColorMaps[themeName] || themeColorMaps.emerald;
  return `
    /* bg-emerald-600 */
    .bg-emerald-600 { background-color: ${map.primary} !important; }
    /* hover:bg-emerald-700 */
    .hover\\:bg-emerald-700:hover { background-color: ${map.active} !important; }
    /* hover:bg-emerald-500 */
    .hover\\:bg-emerald-500:hover { background-color: ${map.hover} !important; }
    /* bg-emerald-50 */
    .bg-emerald-50 { background-color: ${map.light} !important; }
    /* border-emerald-500 */
    .border-emerald-500 { border-color: ${map.border} !important; }
    /* border-emerald-100 */
    .border-emerald-100 { border-color: ${map.borderLight} !important; }
    /* text-emerald-600 */
    .text-emerald-600 { color: ${map.primary} !important; }
    /* text-emerald-700 */
    .text-emerald-700 { color: ${map.active} !important; }
    /* text-emerald-800 */
    .text-emerald-800 { color: ${map.darkText} !important; }
    /* text-emerald-500 */
    .text-emerald-500 { color: ${map.hover} !important; }
    /* text-emerald-400 */
    .text-emerald-400 { color: ${map.textSparkle} !important; }
    /* accent-emerald-600 */
    .accent-emerald-600 { accent-color: ${map.primary} !important; }
    /* focus:border-emerald-500 */
    .focus\\:border-emerald-500:focus { border-color: ${map.border} !important; }
    /* focus:ring-emerald-500 */
    .focus\\:ring-emerald-500:focus { --tw-ring-color: ${map.border} !important; }
    /* bg-emerald-100 */
    .bg-emerald-100 { background-color: ${map.badgeBg} !important; }
    /* bg-emerald-950 */
    .bg-emerald-950 { background-color: ${map.bgDarkBadge} !important; }
    /* border-emerald-800 */
    .border-emerald-800 { border-color: ${map.borderDarkBadge} !important; }
    /* border-emerald-900 */
    .border-emerald-900 { border-color: ${map.borderDarkBadge} !important; }
    /* text-emerald-900 */
    .text-emerald-900 { color: ${map.ultraDarkText} !important; }
    
    /* Complex/Opacity classes */
    .bg-emerald-50\\/20 { background-color: rgba(${hexToRgb(map.light)}, 0.2) !important; }
    .bg-emerald-65 { background-color: rgba(${hexToRgb(map.primary)}, 0.65) !important; }
    .bg-emerald-600\\/10 { background-color: rgba(${hexToRgb(map.primary)}, 0.1) !important; }
    .border-emerald-600\\/20 { border-color: rgba(${hexToRgb(map.primary)}, 0.2) !important; }
    .shadow-emerald-900\\/30 { --tw-shadow-color: rgba(${map.shadowColor}, 0.3) !important; }
    .shadow-emerald-900\\/10 { --tw-shadow-color: rgba(${map.shadowColor}, 0.1) !important; }
    .shadow-emerald-200 { --tw-shadow-color: rgba(${hexToRgb(map.primary)}, 0.2) !important; }
    .bg-emerald-55 { background-color: ${map.light} !important; }
    .bg-emerald-500\\/10 { background-color: rgba(${hexToRgb(map.hover)}, 0.1) !important; }
    .bg-emerald-500\\/15 { background-color: rgba(${hexToRgb(map.hover)}, 0.15) !important; }
    .bg-emerald-500\\/5 { background-color: rgba(${hexToRgb(map.hover)}, 0.05) !important; }
    .from-emerald-600 { --tw-gradient-from: ${map.primary} !important; --tw-gradient-to: ${map.primary}00 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
    .to-teal-800 { --tw-gradient-to: ${map.toGrad} !important; }
    .from-emerald-400 { --tw-gradient-from: ${map.fromGradLight} !important; --tw-gradient-to: ${map.fromGradLight}00 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
    .to-teal-300 { --tw-gradient-to: ${map.toGradLight} !important; }
    .selection\\:bg-emerald-500 *::selection { background-color: ${map.hover} !important; }
    .selection\\:bg-emerald-500::selection { background-color: ${map.hover} !important; }
  `;
};

export default function App() {
  // Pestañas principal: 'pantry' | 'recipes' | 'planner'
  const [activeTab, setActiveTab] = useState<"pantry" | "recipes" | "planner">("pantry");

  // --- ESTADOS ---
  const [inventory, setInventory] = useState<any[]>([]);
  const [pantrySortBy, setPantrySortBy] = useState<string>("name");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [mealPlan, setMealPlan] = useState<any[]>([]);

  // --- ESTADOS DE MÚLTIPLES DESPENSAS ---
  const [pantries, setPantries] = useState<any[]>([
    { id: "default", name: "Mi Despensa", theme: "emerald" }
  ]);
  const [activePantryId, setActivePantryId] = useState<string>("default");
  const [showPantryModal, setShowPantryModal] = useState<boolean>(false);
  const [editingPantryId, setEditingPantryId] = useState<string | null>(null);
  const [pantryForm, setPantryForm] = useState({ name: "", theme: "emerald" });

  // --- ESTADOS DE LA LISTA DE LA COMPRA ---
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [selectedPantriesForList, setSelectedPantriesForList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("despensia_shopping_pantries");
      if (saved) return JSON.parse(saved);
      const savedPantries = localStorage.getItem("despensia_pantries");
      if (savedPantries) {
        const parsed = JSON.parse(savedPantries);
        return parsed.map((p: any) => p.id);
      }
      return ["default"];
    } catch {
      return ["default"];
    }
  });
  const [customShoppingItems, setCustomShoppingItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("despensia_shopping_custom");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newCustomShoppingItem, setNewCustomShoppingItem] = useState("");
  const [shoppingCheckedItems, setShoppingCheckedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("despensia_shopping_checked");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto-guardado de la lista en localStorage
  useEffect(() => {
    localStorage.setItem("despensia_shopping_pantries", JSON.stringify(selectedPantriesForList));
  }, [selectedPantriesForList]);

  useEffect(() => {
    localStorage.setItem("despensia_shopping_custom", JSON.stringify(customShoppingItems));
  }, [customShoppingItems]);

  useEffect(() => {
    localStorage.setItem("despensia_shopping_checked", JSON.stringify(shoppingCheckedItems));
  }, [shoppingCheckedItems]);

  // --- ESTADOS DE AUTENTICACIÓN Y SINCRONIZACIÓN SUPABASE ---
  const [session, setSession] = useState<any>(null);
  const [isSyncingWithSupabase, setIsSyncingWithSupabase] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [profilePrefs, setProfilePrefs] = useState<{
    allergies: string[];
    preferences: string[];
    cookingStyle: string;
  }>({
    allergies: [],
    preferences: [],
    cookingStyle: "Saludable y Balanceada"
  });
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Estado del cargador general
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // --- AUXILIRES DE GESTIÓN DE DESPENSAS ---
  const parseCategory = (rawCategory: string) => {
    if (!rawCategory) return { pantryId: "default", category: "Otros", expiryDate: "" };
    const parts = rawCategory.split("::");
    if (parts.length >= 2) {
      return {
        pantryId: parts[0],
        category: parts[1],
        expiryDate: parts[2] || ""
      };
    }
    return { pantryId: "default", category: rawCategory, expiryDate: "" };
  };

  const encodeCategory = (pantryId: string, realCategory: string, expiryDate?: string) => {
    return `${pantryId}::${realCategory}${expiryDate ? `::${expiryDate}` : ""}`;
  };

  const getExpiryStatus = (expiryDateStr: string) => {
    if (!expiryDateStr) return { label: "Sin fecha", color: "text-slate-400 bg-slate-100", days: Infinity, isCritical: false };
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: "Caducado", color: "bg-rose-100 text-rose-800 border border-rose-200/50 font-bold", days: diffDays, isCritical: true, isExpired: true };
    } else if (diffDays === 0) {
      return { label: "Caduca hoy", color: "bg-red-100 text-red-800 border border-red-200/50 font-bold animate-pulse", days: diffDays, isCritical: true, isToday: true };
    } else if (diffDays <= 3) {
      return { label: `Caduca en ${diffDays}d`, color: "bg-amber-100 text-amber-800 border border-amber-200/50 font-bold", days: diffDays, isCritical: true };
    } else {
      const parts = expiryDateStr.split("-");
      const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].substring(2)}` : expiryDateStr;
      return { label: formatted, color: "bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold", days: diffDays, isCritical: false };
    }
  };

  const activeInventory = useMemo(() => {
    const list = inventory
      .filter(food => {
        const { pantryId } = parseCategory(food.category);
        return pantryId === activePantryId;
      })
      .map(food => {
        const { category, expiryDate } = parseCategory(food.category);
        return {
          ...food,
          category: category,
          expiryDate: expiryDate || ""
        };
      });

    if (pantrySortBy === "quantity") {
      return list.sort((a, b) => b.quantity - a.quantity);
    } else if (pantrySortBy === "expiry") {
      return list.sort((a, b) => {
        // Alimentos sin fecha de caducidad van al final
        if (!a.expiryDate && !b.expiryDate) return a.name.localeCompare(b.name);
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.localeCompare(b.expiryDate);
      });
    } else {
      // Orden predeterminado por nombre
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [inventory, activePantryId, pantrySortBy]);

  const expiringItems = useMemo(() => {
    return activeInventory.filter(item => {
      if (!item.expiryDate) return false;
      const status = getExpiryStatus(item.expiryDate);
      return status.isCritical && (parseFloat(item.quantity) > 0);
    });
  }, [activeInventory]);

  const activePantry = pantries.find(p => p.id === activePantryId) || pantries[0] || { id: "default", name: "Mi Despensa", theme: "emerald" };
  const activePantryTheme = activePantry.theme || "emerald";

  // --- AUXILIRES DE LISTA DE LA COMPRA ---
  const shoppingListItems = useMemo(() => {
    // 1. Obtener alimentos con stock crítico o agotado de las despensas seleccionadas
    const itemsFromPantries = inventory.filter(item => {
      const { pantryId } = parseCategory(item.category);
      if (!selectedPantriesForList.includes(pantryId)) return false;
      
      const qty = parseFloat(item.quantity) || 0;
      const unit = (item.unit || "").toLowerCase();
      
      // Si la cantidad es 0 o menor, está agotado
      if (qty <= 0) return true;
      
      // Stock crítico por unidades
      if (unit === 'g' || unit === 'ml') {
        return qty <= 150;
      }
      if (unit === 'kg' || unit === 'l' || unit === 'litros') {
        return qty <= 0.15;
      }
      // Por defecto para unidades (uds) o cualquier otro
      return qty <= 1;
    }).map(item => {
      const { category, pantryId } = parseCategory(item.category);
      const pantryName = pantries.find(p => p.id === pantryId)?.name || "Despensa";
      const pantryTheme = pantries.find(p => p.id === pantryId)?.theme || "emerald";
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: category,
        pantryId: pantryId,
        pantryName: pantryName,
        pantryTheme: pantryTheme,
        isCustom: false
      };
    });

    // 2. Agregar ítems personalizados
    const customItems = customShoppingItems.map((name, idx) => ({
      id: `custom_${idx}`,
      name: name,
      quantity: 0,
      unit: "",
      category: "Otros",
      pantryId: "custom",
      pantryName: "Personalizado",
      pantryTheme: "slate",
      isCustom: true
    }));

    return [...itemsFromPantries, ...customItems];
  }, [inventory, selectedPantriesForList, customShoppingItems, pantries]);

  const handleCopyShoppingList = () => {
    if (shoppingListItems.length === 0) {
      triggerAlert("info", "La lista de la compra está vacía.");
      return;
    }
    const text = shoppingListItems
      .map(item => {
        const checkMark = shoppingCheckedItems.includes(item.id) ? "[x]" : "[ ]";
        if (item.isCustom) {
          return `${checkMark} ${item.name} (Manual)`;
        }
        return `${checkMark} ${item.name} (Stock actual: ${item.quantity} ${item.unit}) - Despensa: ${item.pantryName}`;
      })
      .join("\n");
    
    navigator.clipboard.writeText(text);
    triggerAlert("success", "¡Lista de la compra copiada al portapapeles! 📋");
  };

  const handleCompletePurchase = async () => {
    const checkedIds = shoppingCheckedItems;
    if (checkedIds.length === 0) {
      triggerAlert("info", "No has marcado ningún artículo en la lista de la compra.");
      return;
    }

    setLoading(true);
    try {
      const inventoryItemsToRestock = shoppingListItems.filter(item => !item.isCustom && checkedIds.includes(item.id));
      const customItemsToRemove = shoppingListItems.filter(item => item.isCustom && checkedIds.includes(item.id)).map(item => item.name);

      let restockedCount = 0;

      for (const item of inventoryItemsToRestock) {
        const origItem = inventory.find(it => it.id === item.id);
        if (!origItem) continue;
        
        const restockQty = item.unit === "g" || item.unit === "ml" ? 500 : 6;
        const newQty = origItem.quantity + restockQty;

        if (session?.user) {
          const { error } = await supabase
            .from("inventory")
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq("id", item.id)
            .eq("user_id", session.user.id);
          if (error) throw error;
        } else {
          await fetch(`/api/inventory/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty })
          });
        }
        restockedCount++;
      }

      let newCustomItems = customShoppingItems;
      if (customItemsToRemove.length > 0) {
        newCustomItems = customShoppingItems.filter(name => !customItemsToRemove.includes(name));
        setCustomShoppingItems(newCustomItems);
      }

      const newCheckedItems = shoppingCheckedItems.filter(id => !checkedIds.includes(id));
      setShoppingCheckedItems(newCheckedItems);

      await saveShoppingListMetadata(selectedPantriesForList, newCustomItems, newCheckedItems);

      triggerAlert("success", `¡Compra completada con éxito! Se han repuesto ${restockedCount} productos en tu despensa y se han eliminado ${customItemsToRemove.length} artículos manuales.`);
      fetchData();
    } catch (err: any) {
      console.error("Error al completar la compra:", err);
      triggerAlert("error", "Error al completar la compra: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const handleRestockItem = async (itemId: string, restockQty: number) => {
    const item = inventory.find(it => it.id === itemId);
    if (!item) return;
    const newQty = item.quantity + restockQty;

    setLoading(true);
    try {
      if (session?.user) {
        const { error } = await supabase
          .from("inventory")
          .update({ quantity: newQty, last_updated: new Date().toISOString() })
          .eq("id", itemId)
          .eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        await fetch(`/api/inventory/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty })
        });
      }
      triggerAlert("success", `¡${item.name} repuesto con éxito!`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Error al reponer alimento: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const getThemeHex = (themeName: string) => {
    const hexColors: Record<string, string> = {
      emerald: "#10b981",
      amber: "#f59e0b",
      rose: "#f43f5e",
      indigo: "#6366f1",
      violet: "#8b5cf6"
    };
    return hexColors[themeName] || "#10b981";
  };

  const saveShoppingListMetadata = async (pantriesList: string[], custom: string[], checked: string[]) => {
    if (session?.user) {
      try {
        await supabase.auth.updateUser({
          data: {
            shopping_pantries: pantriesList,
            shopping_custom: custom,
            shopping_checked: checked
          }
        });
      } catch (err) {
        console.error("Error updating shopping list metadata on Supabase:", err);
      }
    }
  };

  const savePantries = async (newPantries: any[], newActiveId: string) => {
    setPantries(newPantries);
    setActivePantryId(newActiveId);

    // Auto-select the newly added pantries in the shopping list
    setSelectedPantriesForList(prev => {
      const pantryIds = newPantries.map(p => p.id);
      const prevChecked = prev.filter(id => pantryIds.includes(id));
      const newlyAdded = pantryIds.filter(id => !prev.includes(id));
      const updated = [...prevChecked, ...newlyAdded];
      localStorage.setItem("despensia_shopping_pantries", JSON.stringify(updated));
      saveShoppingListMetadata(updated, customShoppingItems, shoppingCheckedItems);
      return updated;
    });

    if (session?.user) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            pantries: newPantries,
            activePantryId: newActiveId
          }
        });
        if (error) throw error;
      } catch (err: any) {
        console.error("Error saving pantries to Supabase:", err);
        triggerAlert("error", "No se pudo guardar la configuración de despensas en la nube.");
      }
    } else {
      localStorage.setItem("despensia_pantries", JSON.stringify(newPantries));
      localStorage.setItem("despensia_active_pantry", newActiveId);
    }
  };

  const handleDeletePantry = async (pantryIdToDelete: string) => {
    if (pantryIdToDelete === "default") {
      triggerAlert("error", "No puedes eliminar la despensa principal.");
      return;
    }
    
    if (!confirm("¿Estás seguro de que deseas eliminar esta despensa? Todos los alimentos asociados a ella se eliminarán permanentemente.")) {
      return;
    }

    setLoading(true);
    try {
      // Find foods to delete
      const itemsToDelete = inventory.filter(item => {
        const { pantryId } = parseCategory(item.category);
        return pantryId === pantryIdToDelete;
      });

      // Delete foods
      for (const item of itemsToDelete) {
        if (session?.user) {
          await supabase
            .from("inventory")
            .delete()
            .eq("id", item.id)
            .eq("user_id", session.user.id);
        } else {
          await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
        }
      }

      // Filter out deleted pantry
      const updatedPantries = pantries.filter(p => p.id !== pantryIdToDelete);
      let newActiveId = activePantryId;
      if (activePantryId === pantryIdToDelete) {
        newActiveId = "default";
      }

      await savePantries(updatedPantries, newActiveId);
      triggerAlert("success", "Despensa y sus alimentos eliminados correctamente.");
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Fallo al eliminar despensa: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  // --- FILTROS Y BÚSQUEDAS ---
  const [pantrySearch, setPantrySearch] = useState("");
  const [pantryFilter, setPantryFilter] = useState("Todos");

  // --- GESTIÓN MANUAL INVENTARIO ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    quantity: "",
    unit: "g",
    category: "Verduras/Frutas",
    expiryDate: ""
  });
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [isCategoryManuallySet, setIsCategoryManuallySet] = useState(false);

  // --- ESCANER DE TICKETS IA ---
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerDraft, setScannerDraft] = useState<any[]>([]);
  const [ticketTips, setTicketTips] = useState("Listo para analizar...");

  // --- CHEF IA: GENERADOR ---
  const [selectedForRecipe, setSelectedForRecipe] = useState<string[]>([]);
  const [chefExtraPrompt, setChefExtraPrompt] = useState("");
  const [useOnlyPantryIngredients, setUseOnlyPantryIngredients] = useState<boolean>(() => {
    return localStorage.getItem("despensia_use_only_pantry") === "true";
  });

  useEffect(() => {
    localStorage.setItem("despensia_use_only_pantry", String(useOnlyPantryIngredients));
  }, [useOnlyPantryIngredients]);

  const [prioritizeExpiringIngredients, setPrioritizeExpiringIngredients] = useState<boolean>(() => {
    return localStorage.getItem("despensia_prioritize_expiring") === "true";
  });

  useEffect(() => {
    localStorage.setItem("despensia_prioritize_expiring", String(prioritizeExpiringIngredients));
  }, [prioritizeExpiringIngredients]);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [generatedRecipeDraft, setGeneratedRecipeDraft] = useState<any | null>(null);
  const [chefSearchQuery, setChefSearchQuery] = useState("");
  const [showChefSearchDropdown, setShowChefSearchDropdown] = useState(false);

  // --- CHEF IA: PROPUESTAS Y METAS DE MACROS ---
  const [macroCal, setMacroCal] = useState<number | "">("");
  const [macroProt, setMacroProt] = useState<number | "">("");
  const [macroCarb, setMacroCarb] = useState<number | "">("");
  const [macroFat, setMacroFat] = useState<number | "">("");
  const [recipeProposals, setRecipeProposals] = useState<any[] | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  // (Estados y auto-guardado de Lista de la Compra se movieron al principio del componente)

  // --- IMPORTADOR DE RECETAS ---
  const [showRecipeImporter, setShowRecipeImporter] = useState(false);
  const [importingText, setImportingText] = useState("");
  const [importingState, setImportingState] = useState(false);

  // --- MODO COCINA LIVE ---
  const [liveRecipe, setLiveRecipe] = useState<any | null>(null);
  const [liveCurrentStep, setLiveCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [cookingTimeLeft, setCookingTimeLeft] = useState<number | null>(null);
  const [cookingTimerActive, setCookingTimerActive] = useState(false);
  const [cookingTimerOriginalValue, setCookingTimerOriginalValue] = useState<number>(0);
  const [livePlannedItem, setLivePlannedItem] = useState<any | null>(null);
  const [liveIngredientsToConsume, setLiveIngredientsToConsume] = useState<any[]>([]);

  // --- PLANIFICADOR ---
  const [selectedPlannerDay, setSelectedPlannerDay] = useState("Lunes");
  const [selectedPlannerMeal, setSelectedPlannerMeal] = useState("Comida");
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState("");
  
  // Soporte para todo el año, macros y objetivos
  const [selectedPlannerDate, setSelectedPlannerDate] = useState(() => formatLocalDate(new Date()));
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  
  const [macroGoals, setMacroGoals] = useState<MacroGoals>(() => {
    try {
      const saved = localStorage.getItem("despensia_macro_goals");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error al cargar objetivos de macros del localStorage", e);
    }
    return { calories: 2000, protein: 130, carbs: 220, fat: 70 };
  });

  useEffect(() => {
    localStorage.setItem("despensia_macro_goals", JSON.stringify(macroGoals));
  }, [macroGoals]);

  const weekDates = useMemo(() => {
    return getWeekDates(currentWeekDate);
  }, [currentWeekDate]);

  // Totales de macros por día en la semana actual
  const weekMacrosTotals = useMemo(() => {
    const totals: Record<string, Macros> = {};
    weekDates.forEach(date => {
      const dateStr = formatLocalDate(date);
      totals[dateStr] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      
      const dayMeals = mealPlan.filter((p: any) => p.date === dateStr);
      dayMeals.forEach((planned: any) => {
        const recipe = recipes.find(r => r.id === planned.recipe_id);
        if (recipe && recipe.macros_summary) {
          const macros = parseMacros(recipe.macros_summary);
          totals[dateStr].calories += macros.calories;
          totals[dateStr].protein += macros.protein;
          totals[dateStr].carbs += macros.carbs;
          totals[dateStr].fat += macros.fat;
        }
      });
    });
    return totals;
  }, [weekDates, mealPlan, recipes]);

  // ==========================================
  // EFECTOS E INICIALIZACIÓN
  // ==========================================
  useEffect(() => {
    // 1. Obtener la sesión inicial de forma segura
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsSyncingWithSupabase(!!initialSession);
    });

    // 2. Escuchar cambios de sesión en vivo
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsSyncingWithSupabase(!!currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      const metadata = session.user.user_metadata;
      if (metadata) {
        setProfilePrefs({
          allergies: metadata.allergies || [],
          preferences: metadata.preferences || [],
          cookingStyle: metadata.cookingStyle || "Saludable y Balanceada"
        });
        if (metadata.pantries) {
          setPantries(metadata.pantries);
        } else {
          setPantries([{ id: "default", name: "Mi Despensa", theme: "emerald" }]);
        }
        if (metadata.shopping_pantries) {
          setSelectedPantriesForList(metadata.shopping_pantries);
        } else if (metadata.pantries) {
          setSelectedPantriesForList(metadata.pantries.map((p: any) => p.id));
        }
        if (metadata.shopping_custom) {
          setCustomShoppingItems(metadata.shopping_custom);
        }
        if (metadata.shopping_checked) {
          setShoppingCheckedItems(metadata.shopping_checked);
        }
        if (metadata.activePantryId) {
          setActivePantryId(metadata.activePantryId);
        } else {
          setActivePantryId("default");
        }
        if (!metadata.setup_completed) {
          setShowOnboardingModal(true);
          setOnboardingStep(1);
        } else {
          setShowOnboardingModal(false);
        }
      }
    } else if (guestMode) {
      const localPrefsStr = localStorage.getItem("despensia_prefs");
      if (localPrefsStr) {
        try {
          const parsed = JSON.parse(localPrefsStr);
          setProfilePrefs({
            allergies: parsed.allergies || [],
            preferences: parsed.preferences || [],
            cookingStyle: parsed.cookingStyle || "Saludable y Balanceada"
          });
        } catch (e) {
          console.error("Error parsing local preferences", e);
        }
      }
      const localPantriesStr = localStorage.getItem("despensia_pantries");
      if (localPantriesStr) {
        try {
          setPantries(JSON.parse(localPantriesStr));
        } catch (e) {
          console.error("Error parsing local pantries", e);
        }
      } else {
        setPantries([{ id: "default", name: "Mi Despensa", theme: "emerald" }]);
      }
      const localShoppingPantries = localStorage.getItem("despensia_shopping_pantries");
      if (localShoppingPantries) {
        try { setSelectedPantriesForList(JSON.parse(localShoppingPantries)); } catch (e) {}
      } else if (localPantriesStr) {
        try { setSelectedPantriesForList(JSON.parse(localPantriesStr).map((p: any) => p.id)); } catch (e) {}
      }
      const localShoppingCustom = localStorage.getItem("despensia_shopping_custom");
      if (localShoppingCustom) {
        try { setCustomShoppingItems(JSON.parse(localShoppingCustom)); } catch (e) {}
      }
      const localShoppingChecked = localStorage.getItem("despensia_shopping_checked");
      if (localShoppingChecked) {
        try { setShoppingCheckedItems(JSON.parse(localShoppingChecked)); } catch (e) {}
      }
      const localActivePantryId = localStorage.getItem("despensia_active_pantry");
      if (localActivePantryId) {
        setActivePantryId(localActivePantryId);
      } else {
        setActivePantryId("default");
      }
      const setupCompleted = localStorage.getItem("despensia_setup_completed") === "true";
      if (!setupCompleted) {
        setShowOnboardingModal(true);
        setOnboardingStep(1);
      } else {
        setShowOnboardingModal(false);
      }
    } else {
      setShowOnboardingModal(false);
    }
  }, [session, guestMode]);

  const fetchData = async () => {
    try {
      let cachedCovers: Record<string, string> = {};
      try {
        const resCovers = await fetch("/api/gemini/recipe-covers");
        if (resCovers.ok) {
          cachedCovers = await resCovers.json();
        }
      } catch (e) {
        console.warn("No se pudieron cargar las portadas del servidor:", e);
      }

      if (session?.user) {
        // --- MODO SUPABASE CLOUD SYNC ACTIVO ---
        const [resInv, resRec, resPlan] = await Promise.all([
          supabase.from("inventory").select("*").order("name"),
          supabase.from("recipes").select("*").order("created_at"),
          supabase.from("meal_plan").select("*")
        ]);

        if (resInv.error) throw resInv.error;
        if (resRec.error) throw resRec.error;
        if (resPlan.error) throw resPlan.error;

        const covers = getRecipeCovers();
        const recipesWithCovers = (resRec.data || []).map((r: any) => {
          const normTitle = (r.title || "").trim().toLowerCase();
          return {
            ...r,
            cover_url: r.cover_url || covers[r.id] || cachedCovers[normTitle] || ""
          };
        });

        setInventory(resInv.data || []);
        setRecipes(recipesWithCovers);
        setMealPlan(resPlan.data || []);
      } else {
        // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
        const [resInv, resRec, resPlan] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/recipes"),
          fetch("/api/meal-plan")
        ]);
        if (resInv.ok && resRec.ok && resPlan.ok) {
          const inv = await resInv.json();
          const rec = await resRec.json();
          const plan = await resPlan.json();

          const covers = getRecipeCovers();
          const recipesWithCovers = rec.map((r: any) => {
            const normTitle = (r.title || "").trim().toLowerCase();
            return {
              ...r,
              cover_url: r.cover_url || covers[r.id] || cachedCovers[normTitle] || ""
            };
          });

          setInventory(inv);
          setRecipes(recipesWithCovers);
          setMealPlan(plan);
        }
      }
    } catch (err: any) {
      console.error("Error al sincronizar datos:", err);
      triggerAlert("error", "Error de sincronización: " + (err.message || err.toString()));
    }
  };

  // --- CONTROLADOR AUTENTICACIÓN SUPABASE ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      triggerAlert("error", "Por favor completa el email y contraseña.");
      return;
    }
    if (authPassword.length < 6) {
      triggerAlert("error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        triggerAlert("success", "¡Registro completo! Ya puedes iniciar sesión de forma segura.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        triggerAlert("success", `¡Sincronizado! Bienvenido, ${data.user.email}`);
        setShowAuthModal(false);
      }
      setAuthPassword("");
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Fallo de autenticación: " + (err.message || err.toString()));
    } finally {
      setAuthLoading(false);
    }
  };
  // --- CONTROLADOR ONBOARDING / CONFIGURACIÓN DE PERFIL ---
  const [selectedOnboardingAllergies, setSelectedOnboardingAllergies] = useState<string[]>([]);
  const [customOnboardingAllergies, setCustomOnboardingAllergies] = useState<string>("");
  const [selectedOnboardingStyle, setSelectedOnboardingStyle] = useState<string>("Saludable y Fitness");
  const [selectedOnboardingStaples, setSelectedOnboardingStaples] = useState<string[]>([]);

  useEffect(() => {
    if (showOnboardingModal) {
      const predefinedIds = ALLERGY_OPTIONS.map(opt => opt.id);
      const predefinedSelected = profilePrefs.allergies.filter(id => predefinedIds.includes(id));
      const customSelected = profilePrefs.allergies.filter(id => !predefinedIds.includes(id)).join(", ");
      
      setSelectedOnboardingAllergies(predefinedSelected);
      setCustomOnboardingAllergies(customSelected);
      setSelectedOnboardingStyle(profilePrefs.cookingStyle);
      setSelectedOnboardingStaples([]);
    }
  }, [showOnboardingModal, profilePrefs]);

  const handleSaveOnboarding = async () => {
    setLoading(true);
    try {
      const customParsed = customOnboardingAllergies
        .split(",")
        .map(x => x.trim())
        .filter(x => x.length > 0);

      const finalAllergies = [...selectedOnboardingAllergies, ...customParsed];

      const payloadPrefs = {
        allergies: finalAllergies,
        preferences: [],
        cookingStyle: selectedOnboardingStyle
      };

      if (session?.user) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            allergies: finalAllergies,
            preferences: [],
            cookingStyle: selectedOnboardingStyle,
            setup_completed: true
          }
        });
        if (authError) throw authError;
      } else {
        localStorage.setItem("despensia_prefs", JSON.stringify(payloadPrefs));
        localStorage.setItem("despensia_setup_completed", "true");
      }

      const staplesToInsert = BASIC_INGREDIENT_OPTIONS
        .filter(item => selectedOnboardingStaples.includes(item.name))
        .map(item => {
          if (session?.user) {
            return {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: encodeCategory(activePantryId, item.category),
              user_id: session.user.id,
              last_updated: new Date().toISOString()
            };
          } else {
            return {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: encodeCategory(activePantryId, item.category)
            };
          }
        });

      if (staplesToInsert.length > 0) {
        if (session?.user) {
          const { error: dbError } = await supabase
            .from("inventory")
            .insert(staplesToInsert);
          if (dbError) throw dbError;
        } else {
          const res = await fetch("/api/inventory/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: staplesToInsert })
          });
          if (!res.ok) throw new Error("Fallo al registrar ingredientes en lote.");
        }
      }

      setProfilePrefs(payloadPrefs);
      triggerAlert("success", "¡Perfil configurado y despensa inicial cargada con éxito!");
      setShowOnboardingModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Error al guardar perfil: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setIsSyncingWithSupabase(false);
      setGuestMode(false);
      triggerAlert("info", "Cloud Sync pausado. Se han restablecido los datos locales offline.");
    } catch (err: any) {
      triggerAlert("error", "Error al pausar sincronización: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (type: "success" | "error" | "info", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // ==========================================
  // LÓGICA INVENTARIO (CRUD)
  // ==========================================
  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name.trim() || !newFood.quantity) {
      triggerAlert("error", "Por favor completa el nombre y la cantidad de alimento.");
      return;
    }

    try {
      const encodedCat = encodeCategory(activePantryId, newFood.category, newFood.expiryDate);
      if (session?.user) {
        // --- MODO SUPABASE CLOUD SYNC ---
        if (editingFoodId) {
          const { error } = await supabase
            .from("inventory")
            .update({
              name: newFood.name,
              quantity: parseFloat(newFood.quantity),
              unit: newFood.unit,
              category: encodedCat,
              last_updated: new Date().toISOString()
            })
            .eq("id", editingFoodId)
            .eq("user_id", session.user.id);
          
          if (error) throw error;
          triggerAlert("success", `Alimento "${newFood.name}" actualizado en la nube.`);
          setEditingFoodId(null);
        } else {
          const { error } = await supabase
            .from("inventory")
            .insert({
              name: newFood.name,
              quantity: parseFloat(newFood.quantity),
              unit: newFood.unit,
              category: encodedCat,
              user_id: session.user.id,
              last_updated: new Date().toISOString()
            });

          if (error) throw error;
          triggerAlert("success", `Alimento "${newFood.name}" añadido a tu despensa en la nube.`);
        }
      } else {
        // --- MODO LOCAL SANDBOX FALLBACK (EXPRESS SERVER) ---
        if (editingFoodId) {
          const res = await fetch(`/api/inventory/${editingFoodId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newFood.name,
              quantity: parseFloat(newFood.quantity),
              unit: newFood.unit,
              category: encodedCat
            })
          });
          if (res.ok) {
            triggerAlert("success", `Alimento "${newFood.name}" actualizado correctamente.`);
            setEditingFoodId(null);
          }
        } else {
          const res = await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newFood.name,
              quantity: parseFloat(newFood.quantity),
              unit: newFood.unit,
              category: encodedCat
            })
          });
          if (res.ok) {
            triggerAlert("success", `Alimento "${newFood.name}" añadido a tu despensa.`);
          }
        }
      }

      setNewFood({ name: "", quantity: "", unit: "g", category: "Verduras/Frutas", expiryDate: "" });
      setIsCategoryManuallySet(false);
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Ocurrió un error al guardar el alimento: " + (err.message || err.toString()));
    }
  };

  const handleEditClick = (food: any) => {
    setEditingFoodId(food.id);
    setIsCategoryManuallySet(true);
    setNewFood({
      name: food.name,
      quantity: food.quantity.toString(),
      unit: food.unit,
      category: food.category,
      expiryDate: food.expiryDate || ""
    });
    setShowAddForm(true);
  };

  const handleDeleteFood = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar o tirar "${name}" de tu despensa?`)) return;
    try {
      if (session?.user) {
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) throw error;
        triggerAlert("info", `Eliminado "${name}" de la nube.`);
        fetchData();
      } else {
        const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        if (res.ok) {
          triggerAlert("info", `Eliminado "${name}" de la despensa.`);
          fetchData();
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Error al eliminar alimento: " + (err.message || err.toString()));
    }
  };

  // Modificar cantidades de despensa de manera rápida (+/-)
  const adjustQuantityQuick = async (id: string, current: number, change: number, unit: string) => {
    const nextVal = Math.max(0, current + change);
    try {
      if (session?.user) {
        const { error } = await supabase
          .from("inventory")
          .update({ quantity: nextVal, last_updated: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) throw error;
        fetchData();
      } else {
        const res = await fetch(`/api/inventory/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: nextVal })
        });
        if (res.ok) {
          fetchData();
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Fallo al ajustar cantidad: " + (err.message || err.toString()));
    }
  };

  // ==========================================
  // LÓGICA ESCANEAR TICKET CON GEMINI (📸 IA)
  // ==========================================
  // Simular la subida dándole un ticket pre-parseado o enviando una imagen real a procesar
  const handleUploadTicketImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setTicketTips("Subiendo imagen de la compra...");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setTicketTips("Chef Gemini está analizando las letras arrugadas del ticket...");
      
      try {
        const response = await fetch("/api/gemini/parse-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data: base64String,
            mimeType: file.type
          })
        });
        
        if (response.ok) {
          const parsedFoods = await response.json();
          const itemsWithExpiry = parsedFoods.map((item: any) => {
            const shelfLife = item.estimated_shelf_life_days || 7;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + shelfLife);
            const expiryStr = expiryDate.toISOString().split("T")[0];
            return {
              ...item,
              expiryDate: expiryStr
            };
          });
          setScannerDraft(itemsWithExpiry);
          setTicketTips(`¡Analizado con éxito! Extrajimos ${itemsWithExpiry.length} alimentos de tu ticket.`);
          triggerAlert("success", "Ticket escaneado correctamente. Revisa la lista propuesta.");
        } else {
          const errData = await response.json().catch(() => ({}));
          const detailedMsg = errData.error
            ? `${errData.error}${errData.details ? ` (${errData.details})` : ""}`
            : "Fallo al analizar el ticket digital.";
          triggerAlert("error", detailedMsg);
          setTicketTips("Un error ocurrió en la IA. Inténtalo de nuevo o usa una carga simulada.");
        }
      } catch (err) {
        triggerAlert("error", "Fallo al conectar con el servidor de análisis multimodal.");
        setTicketTips("Error de conexión.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const useSampleTicket = (sample: any) => {
    setScanning(true);
    setTicketTips("Cargando simulador de ticket de supermercado de alta fidelidad...");
    setTimeout(() => {
      const itemsWithExpiry = sample.items.map((item: any) => {
        const shelfLife = item.estimated_shelf_life_days || 7;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + shelfLife);
        const expiryStr = expiryDate.toISOString().split("T")[0];
        return {
          ...item,
          expiryDate: expiryStr
        };
      });
      setScannerDraft(itemsWithExpiry);
      setTicketTips(`¡Carga instantánea! Se han extraído ${itemsWithExpiry.length} alimentos.`);
      setScanning(false);
      triggerAlert("success", `Ejemplo "${sample.name}" cargado para revisión.`);
    }, 1500);
  };

  const handleRemoveDraftItem = (index: number) => {
    setScannerDraft(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateDraftItem = (index: number, key: string, value: any) => {
    setScannerDraft(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleImportScannerDraft = async () => {
    if (scannerDraft.length === 0) return;
    setLoading(true);
    try {
      // Registrar cada elemento individualmente en la base de datos de despensa
      for (const item of scannerDraft) {
        // Comprobar si ya existe uno igual para sumar la cantidad
        const existing = activeInventory.find(
          it => it.name.toLowerCase() === item.name.toLowerCase() && it.unit === item.unit
        );

        if (session?.user) {
          // --- MODO CLOUD (SUPABASE) ---
          if (existing) {
            const nextQty = existing.quantity + parseFloat(item.quantity);
            const { error } = await supabase
              .from("inventory")
              .update({
                quantity: nextQty,
                category: encodeCategory(activePantryId, existing.category, item.expiryDate || existing.expiryDate),
                last_updated: new Date().toISOString()
              })
              .eq("id", existing.id)
              .eq("user_id", session.user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("inventory")
              .insert({
                name: item.name,
                quantity: parseFloat(item.quantity),
                unit: item.unit,
                category: encodeCategory(activePantryId, item.category, item.expiryDate),
                user_id: session.user.id,
                last_updated: new Date().toISOString()
              });
            if (error) throw error;
          }
        } else {
          // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
          if (existing) {
            await fetch(`/api/inventory/${existing.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quantity: existing.quantity + parseFloat(item.quantity),
                category: encodeCategory(activePantryId, existing.category, item.expiryDate || existing.expiryDate)
              })
            });
          } else {
            await fetch("/api/inventory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                quantity: parseFloat(item.quantity),
                unit: item.unit,
                category: encodeCategory(activePantryId, item.category, item.expiryDate)
              })
            });
          }
        }
      }

      triggerAlert("success", `¡Se han importado ${scannerDraft.length} productos a tu despensa!`);
      setScannerDraft([]);
      setShowScanner(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Error al importar productos: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LÓGICA GENERAR E IMPORTAR RECETAS (IA)
  // ==========================================
  const toggleSelectForRecipe = (foodName: string) => {
    setSelectedForRecipe(prev => 
      prev.includes(foodName) ? prev.filter(name => name !== foodName) : [...prev, foodName]
    );
  };

  const selectAllWithStock = () => {
    const list = activeInventory.filter(it => it.quantity > 0).map(it => it.name);
    setSelectedForRecipe(list);
  };

  const handleGenerateRecipeWithIA = async (force: boolean = false) => {
    if (selectedForRecipe.length === 0) {
      triggerAlert("error", "Selecciona al menos un ingrediente de tu despensa para componer el prompt.");
      return;
    }

    setGeneratingRecipe(true);
    setRecipeProposals(null);
    setGeneratedRecipeDraft(null);
    setSelectedProposal(null);

    try {
      // Filtrar alimentos completos que están seleccionados (incluyendo personalizados)
      const itemsSelected = selectedForRecipe.map(name => {
        const inventoryItem = activeInventory.find(it => it.name.toLowerCase() === name.toLowerCase());
        return inventoryItem ? {
          name: inventoryItem.name,
          quantity: inventoryItem.quantity,
          unit: inventoryItem.unit,
          expiryDate: inventoryItem.expiryDate || ""
        } : {
          name: name,
          quantity: 0,
          unit: "",
          expiryDate: ""
        };
      });

      const res = await fetch("/api/gemini/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIngredients: itemsSelected,
          extraPrompt: chefExtraPrompt,
          allergies: profilePrefs.allergies,
          preferences: profilePrefs.preferences,
          cookingStyle: profilePrefs.cookingStyle,
          forceRegenerate: force === true,
          useOnlyPantryIngredients: useOnlyPantryIngredients,
          prioritizeExpiringIngredients: prioritizeExpiringIngredients,
          action: "propose",
          macroTargets: {
            calories: macroCal || undefined,
            protein: macroProt || undefined,
            carbs: macroCarb || undefined,
            fat: macroFat || undefined
          }
        })
      });

      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        triggerAlert("error", errorData.error || "Se ha excedido el límite de llamadas mensuales a Gemini.");
        return;
      }

      if (res.ok) {
        const result = await res.json();
        if (result.proposals) {
          setRecipeProposals(result.proposals);
          if (result._cached) {
            triggerAlert("info", "Propuestas servidas al instante desde la caché (sin consumir créditos).");
          } else {
            triggerAlert("success", "Hemos formulado 3 propuestas basadas en tu despensa. ¡Elige una!");
          }
        } else {
          setGeneratedRecipeDraft(result);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        const detailedMsg = errorData.error
          ? `${errorData.error}${errorData.details ? ` (${errorData.details})` : ""}`
          : "Error al formular la propuesta culinaria con Gemini.";
        triggerAlert("error", detailedMsg);
      }
    } catch (err) {
      triggerAlert("error", "Error de red conectando con Gemini.");
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const handleExpandProposal = async (proposal: any, force: boolean = false) => {
    setGeneratingRecipe(true);
    setSelectedProposal(proposal);
    setGeneratedRecipeDraft(null);

    try {
      const itemsSelected = selectedForRecipe.map(name => {
        const inventoryItem = activeInventory.find(it => it.name.toLowerCase() === name.toLowerCase());
        return inventoryItem ? {
          name: inventoryItem.name,
          quantity: inventoryItem.quantity,
          unit: inventoryItem.unit,
          expiryDate: inventoryItem.expiryDate || ""
        } : {
          name: name,
          quantity: 0,
          unit: "",
          expiryDate: ""
        };
      });

      const res = await fetch("/api/gemini/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIngredients: itemsSelected,
          extraPrompt: chefExtraPrompt,
          allergies: profilePrefs.allergies,
          preferences: profilePrefs.preferences,
          cookingStyle: profilePrefs.cookingStyle,
          forceRegenerate: force === true,
          useOnlyPantryIngredients: useOnlyPantryIngredients,
          prioritizeExpiringIngredients: prioritizeExpiringIngredients,
          action: "expand",
          selectedProposal: proposal,
          macroTargets: {
            calories: macroCal || undefined,
            protein: macroProt || undefined,
            carbs: macroCarb || undefined,
            fat: macroFat || undefined
          }
        })
      });

      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        triggerAlert("error", errorData.error || "Se ha excedido el límite de llamadas mensuales a Gemini.");
        return;
      }

      if (res.ok) {
        const recipeResult = await res.json();
        setGeneratedRecipeDraft(recipeResult);
        if (recipeResult._cached) {
          triggerAlert("info", "Receta servida al instante desde la caché (sin consumir créditos).");
        } else {
          triggerAlert("success", `Receta "${recipeResult.title}" expandida redactada por Chef Gemini.`);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        triggerAlert("error", errorData.error || "Error al expandir la propuesta culinaria con Gemini.");
      }
    } catch (err) {
      triggerAlert("error", "Error de red conectando con Gemini.");
    } finally {
      setGeneratingRecipe(false);
    }
  };

  // Guardar la receta generada en el catálogo general
  const handleSaveRecipeDraft = async () => {
    if (!generatedRecipeDraft) return;
    try {
      if (session?.user) {
        // --- MODO CLOUD (SUPABASE) ---
        const { error } = await supabase
          .from("recipes")
          .insert({
            title: generatedRecipeDraft.title,
            ingredients_required: generatedRecipeDraft.ingredients_required,
            instructions: generatedRecipeDraft.instructions,
            macros_summary: generatedRecipeDraft.macros_summary,
            user_id: session.user.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        triggerAlert("success", "¡Receta guardada exitosamente en tu Recetario Cloud!");
        setGeneratedRecipeDraft(null);
        setSelectedForRecipe([]);
        setChefExtraPrompt("");
        fetchData();
      } else {
        // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: generatedRecipeDraft.title,
            ingredients_required: generatedRecipeDraft.ingredients_required,
            instructions: generatedRecipeDraft.instructions,
            macros_summary: generatedRecipeDraft.macros_summary
          })
        });

        if (res.ok) {
          triggerAlert("success", "¡Receta guardada exitosamente en tu Recetario!");
          setGeneratedRecipeDraft(null);
          setSelectedForRecipe([]);
          setChefExtraPrompt("");
          fetchData();
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "No se pudo guardar la receta: " + (err.message || err.toString()));
    }
  };

  // Dar me gusta a una receta
  const handleLikeRecipe = async (id: string) => {
    try {
      // Optimistic update en la interfaz
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r));
      
      if (session?.user) {
        // --- MODO CLOUD (SUPABASE) ---
        const recipeToLike = recipes.find(r => r.id === id);
        if (recipeToLike) {
          const { error } = await supabase
            .from("recipes")
            .update({ likes: (recipeToLike.likes || 0) + 1 })
            .eq("id", id);
          if (error) {
            console.warn("No se pudo persistir el like en Supabase (campo ausente en la tabla):", error);
          }
        }
      } else {
        // --- MODO SANDBOX LOCAL ---
        const res = await fetch(`/api/recipes/${id}/like`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setRecipes(prev => prev.map(r => r.id === id ? { ...r, likes: data.likes } : r));
          triggerAlert("success", "¡Te gusta esta receta! ❤️");
        }
      }
    } catch (err) {
      console.error("Error al registrar el like:", err);
    }
  };

  // Buscar recetas populares coincidentes (Popular Match)
  const getPopularRecipeMatch = () => {
    if (selectedForRecipe.length === 0 || recipes.length === 0) return null;
    
    let bestMatch: any = null;
    let maxMatchPercentage = 0;
    
    for (const recipe of recipes) {
      if (!recipe.ingredients_required || recipe.ingredients_required.length === 0) continue;
      
      let matchedCount = 0;
      for (const ing of recipe.ingredients_required) {
        const ingName = ing.name.trim().toLowerCase();
        const isMatched = selectedForRecipe.some(sel => {
          const selClean = sel.trim().toLowerCase();
          return selClean.includes(ingName) || ingName.includes(selClean);
        });
        if (isMatched) {
          matchedCount++;
        }
      }
      
      const totalIngs = recipe.ingredients_required.length;
      const matchPercentage = matchedCount / totalIngs;
      
      // Coincidencia >= 75%
      if (matchPercentage >= 0.75 && matchPercentage > maxMatchPercentage) {
        maxMatchPercentage = matchPercentage;
        bestMatch = recipe;
      }
    }
    
    return bestMatch ? { recipe: bestMatch, percentage: Math.round(maxMatchPercentage * 100) } : null;
  };

  const popularMatch = getPopularRecipeMatch();

  // Importar copiada o link
  const handleImportTextRecipe = async () => {
    if (!importingText.trim()) {
      triggerAlert("error", "Pega el texto de la receta o ingredientes que quieras reformatear.");
      return;
    }
    setImportingState(true);
    try {
      const res = await fetch("/api/gemini/parse-recipe-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: importingText })
      });

      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        triggerAlert("error", errorData.error || "Límite mensual excedido.");
        return;
      }

      if (res.ok) {
        const imported = await res.json();
        setGeneratedRecipeDraft(imported);
        setShowRecipeImporter(false);
        setImportingText("");
        triggerAlert("success", `Receta "${imported.title}" interpretada con éxito.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        const detailedMsg = errData.error
          ? `${errData.error}${errData.details ? ` (${errData.details})` : ""}`
          : "No se pudo digerir la receta. Intenta con un texto más conciso.";
        triggerAlert("error", detailedMsg);
      }
    } catch (err) {
      triggerAlert("error", "Conexión médica fallida.");
    } finally {
      setImportingState(false);
    }
  };

  const getRecipeCovers = () => {
    try {
      const saved = localStorage.getItem("despensia_recipe_covers");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveRecipeCover = (recipeId: string, imageUrl: string) => {
    try {
      const covers = getRecipeCovers();
      covers[recipeId] = imageUrl;
      localStorage.setItem("despensia_recipe_covers", JSON.stringify(covers));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateRecipeCover = async (recipe: any) => {
    triggerAlert("info", `Generando fotografía gourmet integrada para "${recipe.title}"...`);
    try {
      const res = await fetch("/api/gemini/generate-recipe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeTitle: recipe.title })
      });
      if (res.ok) {
        const data = await res.json();
        
        // 1. Guardar en el estado local de React
        setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, cover_url: data.imageUrl } : r));
        
        // 2. Guardar en el caché local de localStorage
        saveRecipeCover(recipe.id, data.imageUrl);
        
        // 3. Persistir en la base de datos correspondiente
        if (session?.user) {
          try {
            await supabase
              .from("recipes")
              .update({ cover_url: data.imageUrl })
              .eq("id", recipe.id)
              .eq("user_id", session.user.id);
          } catch (e) {
            console.warn("No se pudo actualizar la columna cover_url en Supabase (puede no existir). Guardado en localStorage fallback.", e);
          }
        } else {
          await fetch(`/api/recipes/${recipe.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cover_url: data.imageUrl })
          });
        }
        
        triggerAlert("success", `Cover personalizado generado para "${recipe.title}".`);
      } else {
        const errData = await res.json().catch(() => ({}));
        const detailedMsg = errData.error
          ? `${errData.error}${errData.details ? ` (${errData.details})` : ""}`
          : "No se pudo procesar la ilustración de la comida.";
        triggerAlert("error", detailedMsg);
      }
    } catch (err) {
      triggerAlert("error", "No se pudo procesar la ilustración de la comida.");
    }
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la receta "${name}" de tu catálogo? Se borrará también de los planes semanal.`)) return;
    try {
      // Limpiar del caché de portadas en localStorage
      try {
        const covers = getRecipeCovers();
        if (covers[id]) {
          delete covers[id];
          localStorage.setItem("despensia_recipe_covers", JSON.stringify(covers));
        }
      } catch (e) {
        console.error(e);
      }

      if (session?.user) {
        // --- MODO CLOUD (SUPABASE) ---
        const { error } = await supabase
          .from("recipes")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) throw error;
        triggerAlert("info", `Receta "${name}" eliminada de la nube.`);
        fetchData();
      } else {
        // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
        const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
        if (res.ok) {
          triggerAlert("info", `Receta "${name}" eliminada.`);
          fetchData();
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Error al borrar receta: " + (err.message || err.toString()));
    }
  };


  // ==========================================
  // LÓGICA MODO COCINA LIVE 🕒🍳
  // ==========================================
  const startLiveCookingMode = (recipe: any, plannedItem: any = null) => {
    setLiveRecipe(recipe);
    setLivePlannedItem(plannedItem);
    setLiveCurrentStep(0);
    
    // Parsear ingredientes para ajustes en vivo de consumo
    const mappedIngredients = recipe.ingredients_required.map((req: any) => {
      // Buscar coincidencia aproximada de alimento en el inventario actual
      const match = activeInventory.find(
        inv => inv.name.toLowerCase().includes(req.name.toLowerCase()) || 
               req.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      
      const reqQty = parseFloat(req.quantity) || 0;
      
      return {
        name: req.name,
        qtyRequired: req.quantity,
        qtyToConsume: reqQty, // por defecto la cantidad requerida
        unit: req.unit || match?.unit || "g",
        inventoryMatchId: match ? match.id : null,
        inventoryMatchName: match ? match.name : null,
        inventoryMatchCurrentQty: match ? match.quantity : 0
      };
    });
    
    setLiveIngredientsToConsume(mappedIngredients);

    // Separar pasos de forma inteligente por saltos de línea o número
    const stepsArray = recipe.instructions
      .split(/\n+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    setCompletedSteps(new Array(stepsArray.length).fill(false));
    
    // Analizar si el primer paso tiene temporizador
    parseStepTimer(stepsArray[0]);
  };

  const adjustLiveQtyToConsume = (index: number, change: number) => {
    setLiveIngredientsToConsume(prev => {
      const next = [...prev];
      const nextVal = Math.max(0, (next[index].qtyToConsume || 0) + change);
      next[index] = { 
        ...next[index], 
        qtyToConsume: parseFloat(nextVal.toFixed(2)) 
      };
      return next;
    });
  };

  const handleLiveQtyInputChange = (index: number, value: string) => {
    setLiveIngredientsToConsume(prev => {
      const next = [...prev];
      if (value === "") {
        next[index] = { ...next[index], qtyToConsume: "" };
      } else {
        const parsed = parseFloat(value);
        next[index] = { ...next[index], qtyToConsume: isNaN(parsed) ? 0 : Math.max(0, parsed) };
      }
      return next;
    });
  };

  const parseStepTimer = (stepText: string) => {
    // Buscar expresiones de tiempo en el paso (ej. "10 minutos", "5 min", "30 seg")
    const minMatch = stepText.match(/(\d+)\s*(min|minuto|minutes)/i);
    const secMatch = stepText.match(/(\d+)\s*(seg|segundo|second)/i);

    if (minMatch) {
      const mins = parseInt(minMatch[1], 10);
      setCookingTimeLeft(mins * 60);
      setCookingTimerOriginalValue(mins * 60);
      setCookingTimerActive(false);
    } else if (secMatch) {
      const secs = parseInt(secMatch[1], 10);
      setCookingTimeLeft(secs);
      setCookingTimerOriginalValue(secs);
      setCookingTimerActive(false);
    } else {
      setCookingTimeLeft(null);
      setCookingTimerActive(false);
    }
  };

  // Effect para cuenta atrás
  useEffect(() => {
    let interval: any = null;
    if (cookingTimerActive && cookingTimeLeft !== null && cookingTimeLeft > 0) {
      interval = setInterval(() => {
        setCookingTimeLeft(p => {
          if (p !== null && p <= 1) {
            setCookingTimerActive(false);
            // Hacer sonar alerta visual o alerta sonora del navegador rápida
            triggerAlert("info", "⏰ ¡TIEMPO TERMINADO! Paso completado.");
            return 0;
          }
          return p !== null ? p - 1 : null;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [cookingTimerActive, cookingTimeLeft]);

  const handleStepCheckbox = (index: number) => {
    setCompletedSteps(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const navigateLiveStep = (direction: number) => {
    if (!liveRecipe) return;
    const steps = liveRecipe.instructions
      .split(/\n+/)
      .filter((s: string) => s.trim().length > 0);

    const nextIndex = liveCurrentStep + direction;
    if (nextIndex >= 0 && nextIndex < steps.length) {
      setLiveCurrentStep(nextIndex);
      parseStepTimer(steps[nextIndex]);
    }
  };

  const handleFinishCooking = async () => {
    setLoading(true);
    let successfullyDeducted = 0;

    try {
      // 1. Descontar las porciones de ingredientes ajustadas en tiempo real de la despensa de base de datos
      for (const ingredient of liveIngredientsToConsume) {
        if (ingredient.inventoryMatchId) {
          const qtyToConsume = parseFloat(ingredient.qtyToConsume) || 0;
          if (qtyToConsume > 0) {
            const nextQty = Math.max(0, ingredient.inventoryMatchCurrentQty - qtyToConsume);
            
            if (session?.user) {
              const { error } = await supabase
                .from("inventory")
                .update({ quantity: nextQty, last_updated: new Date().toISOString() })
                .eq("id", ingredient.inventoryMatchId)
                .eq("user_id", session.user.id);
              if (error) throw error;
            } else {
              // Actualizar stock en el backend
              await fetch(`/api/inventory/${ingredient.inventoryMatchId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: nextQty })
              });
            }
            successfullyDeducted++;
          }
        }
      }

      // 2. Si se vino de una planificación (Weekly Planner), marcar como "consumed" en el backend
      if (livePlannedItem) {
        if (session?.user) {
          const { error } = await supabase
            .from("meal_plan")
            .update({ status: "consumed" })
            .eq("id", livePlannedItem.id)
            .eq("user_id", session.user.id);
          if (error) throw error;
        } else {
          await fetch(`/api/meal-plan/${livePlannedItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "consumed" })
          });
        }

        // Actualizar el estado local react de mealPlan
        setMealPlan(prev => prev.map(p => p.id === livePlannedItem.id ? { ...p, status: "consumed" } : p));
      }

      // 3. Notificar al usuario con su respectiva información
      if (livePlannedItem) {
        triggerAlert("success", `🎉 ¡Enhorabuena! Has terminado de cocinar "${liveRecipe.title}" planificado. Se han actualizado las cantidades reales en la despensa.`);
      } else {
        triggerAlert("success", `🎉 ¡Enhorabuena! Has terminado de cocinar "${liveRecipe.title}". El stock de tu despensa ha sido descontado.`);
      }

      // 4. Limpiar los estados de cocina activa
      setLiveRecipe(null);
      setLivePlannedItem(null);
      setLiveIngredientsToConsume([]);
      setLiveCurrentStep(0);
      setCookingTimeLeft(null);
      setCookingTimerActive(false);

      // Sincronizar los listados con el servidor
      fetchData();
    } catch (err: any) {
      console.error("Error al descontar cantidades e ingrediente de planificación:", err);
      triggerAlert("error", "Error al registrar las mermas de stock: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const formatTimerValue = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  // ==========================================
  // LÓGICA PLANIFICADOR SEMANAL 📅
  // ==========================================
  const handleAddToPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeForPlan) {
      triggerAlert("error", "Selecciona una receta para agendarla.");
      return;
    }

    const [year, month, day] = selectedPlannerDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const computedDayName = getWeekDayNameEs(dateObj);

    try {
      if (session?.user) {
        // --- MODO CLOUD (SUPABASE) ---
        const { data, error } = await supabase
          .from("meal_plan")
          .insert({
            date: selectedPlannerDate,
            plannerDay: computedDayName,
            meal_type: selectedPlannerMeal,
            recipe_id: selectedRecipeForPlan,
            status: "planned",
            user_id: session.user.id
          })
          .select();

        if (error) throw error;
        
        const savedItem = data?.[0];
        if (savedItem) {
          setMealPlan(prev => [...prev, savedItem]);
          triggerAlert("success", `"${recipes.find(r => r.id === selectedRecipeForPlan)?.title}" planificado para el ${computedDayName} (${selectedPlannerDate}) en la ${selectedPlannerMeal} en la nube.`);
          setSelectedRecipeForPlan("");
        }
      } else {
        // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
        const res = await fetch("/api/meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedPlannerDate,
            plannerDay: computedDayName,
            meal_type: selectedPlannerMeal,
            recipe_id: selectedRecipeForPlan,
            status: "planned"
          })
        });

        if (res.ok) {
          const savedItem = await res.json();
          const updatedWithDay = { ...savedItem, plannerDay: computedDayName };
          setMealPlan(prev => [...prev, updatedWithDay]);
          triggerAlert("success", `"${recipes.find(r => r.id === selectedRecipeForPlan)?.title}" planificado para el ${computedDayName} (${selectedPlannerDate}) en la ${selectedPlannerMeal}.`);
          setSelectedRecipeForPlan("");
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "No se pudo planificar la comida: " + (err.message || err.toString()));
    }
  };

  const handleRemoveFromPlan = async (plannedId: string) => {
    try {
      if (session?.user) {
        // --- MODO CLOUD ---
        const { error } = await supabase
          .from("meal_plan")
          .delete()
          .eq("id", plannedId)
          .eq("user_id", session.user.id);
        if (error) throw error;
        setMealPlan(prev => prev.filter(p => p.id !== plannedId));
        triggerAlert("info", "Comida eliminada del plan semanal en la nube.");
      } else {
        // --- MODO LOCAL ---
        const res = await fetch(`/api/meal-plan/${plannedId}`, { method: "DELETE" });
        if (res.ok) {
          setMealPlan(prev => prev.filter(p => p.id !== plannedId));
          triggerAlert("info", "Comida eliminada del plan semanal.");
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Fallo al quitar del menú semanal: " + (err.message || err.toString()));
    }
  };

  // CONSUMIR MENÚ (Resta los ingredientes requeridos de la despensa real en cascada!)
  const handleConsumeMeal = async (plannedItem: any, recipe: any) => {
    setLoading(true);
    let successfullyDeducted = 0;
    let missingAlerts: string[] = [];

    try {
      // 1. Recorrer ingredientes necesarios de la receta
      for (const ingredient of recipe.ingredients_required) {
        // Tratar de buscar coincidencias aproximadas (case insensitive)
        const match = activeInventory.find(
          item => item.name.toLowerCase().includes(ingredient.name.toLowerCase()) || 
                  ingredient.name.toLowerCase().includes(item.name.toLowerCase())
        );

        if (match) {
          // Extraer la porción real eliminando unidades. Ej: "250g" -> 250
          const neededQty = parseFloat(ingredient.quantity) || 0;
          if (neededQty > 0) {
            const nextQty = Math.max(0, match.quantity - neededQty);
            
            if (session?.user) {
              const { error } = await supabase
                .from("inventory")
                .update({ quantity: nextQty, last_updated: new Date().toISOString() })
                .eq("id", match.id)
                .eq("user_id", session.user.id);
              if (error) throw error;
            } else {
              // Actualizar en el back
              await fetch(`/api/inventory/${match.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: nextQty })
              });
            }
            successfullyDeducted++;
          }
        } else {
          missingAlerts.push(ingredient.name);
        }
      }

      // 2. Marcar comida como consumida en el planner
      if (session?.user) {
        const { error } = await supabase
          .from("meal_plan")
          .update({ status: "consumed" })
          .eq("id", plannedItem.id)
          .eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        await fetch(`/api/meal-plan/${plannedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "consumed" })
        });
      }

      // Actualizar estados react locales
      setMealPlan(prev => prev.map(p => p.id === plannedItem.id ? { ...p, status: "consumed" } : p));
      
      if (missingAlerts.length > 0) {
         triggerAlert("info", `Comida consumida. Se descontaron los ingredientes comunes, pero no encontramos: ${missingAlerts.join(", ")}.`);
      } else {
        triggerAlert("success", `¡Buen provecho! Se han descontado los ingredientes de "${recipe.title}" de tu despensa automáticamente.`);
      }

      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Fallo al consumir los alimentos de la despensa: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // COMPLEMENTOS AUXILIARES: INTEGRACIÓN DE INGREDIENTES
  // ==========================================
  // Comprobar la disponibilidad de ingredientes para una receta vs tu inventario real
  const checkIngredientStatus = (recipe: any) => {
    let owned = 0;
    const missing: string[] = [];

    recipe.ingredients_required.forEach((req: any) => {
      const match = activeInventory.find(
        inv => inv.name.toLowerCase().includes(req.name.toLowerCase()) || 
               req.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (match && match.quantity >= (parseFloat(req.quantity) || 0)) {
        owned++;
      } else {
        missing.push(req.name);
      }
    });

    const total = recipe.ingredients_required.length;
    return {
      allAvailable: owned === total,
      owned,
      total,
      missing
    };
  };

  const getDayMeals = (day: string) => {
    return mealPlan.filter(p => p.plannerDay === day || (!p.plannerDay && day === "Lunes"));
  };


  const renderLandingPage = () => {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-900/30 w-10 h-10 flex items-center justify-center overflow-hidden">
                {/* Falling ingredients */}
                <span className="absolute text-[10px] select-none pointer-events-none falling-ing-1">🥕</span>
                <span className="absolute text-[10px] select-none pointer-events-none falling-ing-2">🍅</span>
                <span className="absolute text-[10px] select-none pointer-events-none falling-ing-3">🥦</span>
                
                {/* Custom animated cooking pot */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 z-10">
                  {/* Lid (Rattling) */}
                  <g className="animate-lid">
                    <path d="M10 5h4" />
                    <path d="M12 3v2" />
                    <path d="M4 8h16" />
                    <path d="M5 8c0-1.5 1-3 3-3h8c2 0 3 1.5 3 3" />
                  </g>
                  {/* Pot body (rim & bowl) */}
                  <path d="M2 11h20" />
                  <path d="M19 11v7c0 2-2 3-4 3H9c-2 0-4-1-4-3v-7" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-white">Despensia</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#about-us"
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Quiénes Somos
              </a>
              <button
                onClick={() => {
                  setGuestMode(true);
                  triggerAlert("info", "Has entrado en Modo Invitado. Los datos se guardarán localmente.");
                }}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
              >
                Probar Demo Local
              </button>
              <a
                href="#auth-panel"
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold px-4.5 py-2 rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                Comenzar gratis
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          {/* Background decorative glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Heading & CTAs */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Potenciado con Gemini AI</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                  Escanea tu compra. <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Cocina con lo que tienes.
                  </span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Despensia lee tus tickets de supermercado, gestiona tu stock automáticamente y te propone recetas inteligentes con Inteligencia Artificial. Ahorra tiempo, reduce el desperdicio y simplifica tu día a día.
                </p>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <a
                    href="#auth-panel"
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg hover:shadow-emerald-900/20 transition-all flex items-center gap-2 group"
                  >
                    <span>Comenzar gratis (Nube)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <button
                    onClick={() => {
                      setGuestMode(true);
                      triggerAlert("info", "Has entrado en Modo Invitado. Los datos se guardarán localmente.");
                    }}
                    className="bg-slate-800/80 hover:bg-slate-850 active:scale-95 text-slate-200 font-bold text-sm px-6 py-4 rounded-xl border border-slate-700/60 transition-all shadow-sm cursor-pointer"
                  >
                    Probar Demo sin Registro
                  </button>
                </div>

                <div className="pt-4 flex flex-wrap justify-center lg:justify-start items-center gap-y-4 gap-x-8">
                  <div className="text-center lg:text-left">
                    <span className="block text-2xl font-extrabold text-white">100%</span>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cero Desperdicio</span>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-slate-800" />
                  <div className="text-center lg:text-left">
                    <span className="block text-2xl font-extrabold text-white">Gemini</span>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Análisis Multimodal</span>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-slate-800" />
                  <div className="text-center lg:text-left">
                    <span className="block text-2xl font-extrabold text-white">Cloud Sync</span>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Acceso en Tiempo Real</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Mockup Showcase (Animated Flow) */}
              <div className="lg:col-span-5 relative w-full min-h-[460px] flex items-center justify-center">
                {/* Glowing Background Lights */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/15 rounded-full blur-[60px] animate-pulse-glow" />
                
                <div className="w-full relative space-y-6">
                  {/* Step 1: Scan Mockup */}
                  <div className="bg-white/95 text-slate-800 p-4.5 rounded-2xl shadow-2xl w-56 font-mono text-[10px] relative overflow-hidden border border-slate-200 hover:-rotate-1 hover:scale-102 transition-all duration-300 mr-auto">
                    {/* Glowing Scan Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-md shadow-emerald-450 animate-scanline" />
                    
                    <div className="border-b border-dashed border-slate-350 pb-2 mb-2 text-center font-bold tracking-wider text-slate-600">
                      🛒 SUPERMERCADO DESPENSIA
                    </div>
                    <div className="space-y-1 text-slate-750 font-bold">
                      <div className="flex justify-between"><span>POLLO EN FILETES</span><span>5.80€</span></div>
                      <div className="flex justify-between"><span>TOMATES FRESCOS</span><span>1.95€</span></div>
                      <div className="flex justify-between"><span>CEBOLLA MORADA</span><span>1.20€</span></div>
                    </div>
                    <div className="border-t border-dashed border-slate-350 mt-2.5 pt-2 flex justify-between font-bold text-emerald-600 text-[9px]">
                      <span>EXTRAÍDO CON IA</span>
                      <span>✓ EN STOCK</span>
                    </div>
                  </div>

                  {/* Step 2: Floating Stock Badges */}
                  <div className="absolute top-12 right-4 bg-slate-850/95 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float-slow backdrop-blur-xs">
                    <span className="text-lg">🍗</span>
                    <div>
                      <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Pollo</div>
                      <div className="text-xs font-black text-white mt-0.5">1.0 kg</div>
                    </div>
                  </div>

                  <div className="absolute top-36 right-12 bg-slate-850/95 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float-slow [animation-delay:2s] backdrop-blur-xs">
                    <span className="text-lg">🍅</span>
                    <div>
                      <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Tomates</div>
                      <div className="text-xs font-black text-white mt-0.5">3 uds</div>
                    </div>
                  </div>

                  {/* Step 3: Recipe suggestion Mockup */}
                  <div className="bg-slate-850/95 border border-emerald-500/40 p-5 rounded-3xl shadow-2xl w-68 ml-auto relative overflow-hidden backdrop-blur-xs hover:rotate-1 hover:scale-102 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse-glow" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-emerald-900/50 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Sugerencia IA
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold font-mono">15 min</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">Fajitas de Pollo Express</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Receta recomendada basándose en tus tomates y pollo en stock.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setGuestMode(true);
                        triggerAlert("info", "Iniciando preparación en modo Invitado.");
                      }}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[9px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-900/10"
                    >
                      <Play className="w-2.5 h-2.5 fill-white" /> Cocinar en Vivo
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Step-by-Step Flow Section */}
        <section className="py-24 border-t border-slate-800/80 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">¿Cómo Funciona?</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Tu Cocina Inteligente en 3 Pasos</h2>
              <p className="text-sm sm:text-base text-slate-400 font-medium max-w-xl mx-auto">
                Despensia automatiza todo el proceso: desde que entras al supermercado hasta que sirves el plato.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Paso 1 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 group hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 group-hover:text-emerald-500/20 transition-colors">01</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">1. Haz una foto al ticket</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Sube tu recibo de compra. Nuestra IA Gemini lee los productos y rellena tu inventario automáticamente en segundos.
                  </p>
                </div>
                
                {/* Visual mock for step 1 */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 font-mono text-[9px] relative overflow-hidden h-28 flex flex-col justify-between">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/60 animate-scanline" />
                  <div className="text-slate-500 text-center tracking-wider">--- COMPRA PROCESADA ---</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300"><span>🧀 QUESO FRESCO</span><span className="text-emerald-400 font-bold">+1 ud</span></div>
                    <div className="flex justify-between text-slate-300"><span>🍌 PLÁTANOS</span><span className="text-emerald-400 font-bold">+6 uds</span></div>
                  </div>
                  <div className="bg-emerald-950/60 text-emerald-400 font-sans font-bold text-[9px] px-2 py-1 rounded text-center border border-emerald-900/50">
                    2 ingredientes añadidos con éxito
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300 group hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-amber-600/10 border border-amber-600/20 text-amber-400 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 group-hover:text-amber-500/20 transition-colors">02</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2. Obtén recetas y planifica</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    La IA te propone recetas según tus gustos, alergias e ingredientes en stock. Agéndalas en tu calendario semanal.
                  </p>
                </div>
                
                {/* Visual mock for step 2 */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 h-28 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold font-sans">📅 Lunes (Comida)</span>
                    <span className="text-amber-400 bg-amber-950/60 border border-amber-900/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Gemini</span>
                  </div>
                  <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-white leading-tight">Ensalada de Queso y Plátano</h4>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5">Usa Queso y Plátano de tu stock</p>
                    </div>
                    <span className="text-xs">🥗</span>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-teal-600/10 border border-teal-600/20 text-teal-400 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 group-hover:text-teal-500/20 transition-colors">03</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">3. Cocina y resta stock</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Sigue la receta paso a paso. Al terminar, la app descuenta automáticamente del inventario las cantidades reales consumidas.
                  </p>
                </div>
                
                {/* Visual mock for step 3 */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 h-28 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-semibold font-sans">Cocina en Vivo 👨‍🍳</span>
                    <span className="text-[8px] bg-emerald-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-900/50">¡Completado!</span>
                  </div>
                  <div className="text-center py-1">
                    <span className="text-[9px] font-mono text-slate-500 block">DESCONTANDO STOCK...</span>
                    <span className="text-[10px] font-black text-rose-400">-1 ud Queso  •  -1 ud Plátano</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us / THC Labs Section */}
        <section id="about-us" className="py-20 border-t border-slate-800/80 bg-slate-900/60 relative overflow-hidden text-left">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-slate-850/40 border border-slate-800/70 p-8 sm:p-12 rounded-3xl backdrop-blur-xs text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
                <span>THC Labs Project</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Desarrollado por THC Labs</h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto">
                Despensia es un proyecto independiente (indie) desarrollado sin financiación externa. Nuestro objetivo es crear una herramienta útil, directa y sin rodeos para optimizar tu despensa y reducir el desperdicio.
              </p>
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800/50 text-left space-y-4 max-w-2xl mx-auto">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  🚀 ¿Cómo colaborar?
                </h4>
                <ul className="text-xs text-slate-350 space-y-2.5 list-disc list-inside">
                  <li><strong>Apoyo económico</strong>: Si quieres ayudarnos a mantener los servidores y la API de Gemini, puedes <a href="https://ko-fi.com/thclabs" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">invitarnos a un café en Ko-fi</a>.</li>
                  <li><strong>Feedback y sugerencias</strong>: Escríbenos con cualquier idea o fallo que detectes para seguir mejorando.</li>
                  <li><strong>Comparte la app</strong>: Si la app te resulta útil, recomiéndala a tus amigos o familiares.</li>
                </ul>
              </div>
              <div className="pt-2 flex flex-wrap gap-4 justify-center">
                <a 
                  href="https://ko-fi.com/thclabs" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  ☕ Apóyanos en Ko-fi
                </a>
                <a 
                  href="mailto:contact@thclabs.co" 
                  className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-extrabold text-xs px-6 py-3.5 rounded-xl border border-slate-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  ✉️ Contactar con THC Labs
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Authentication Panel */}
        <section id="auth-panel" className="py-24 relative overflow-hidden bg-slate-950/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-md mx-auto px-4 relative z-10 text-center">
            
            <div className="bg-slate-850/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
              <div className="mx-auto w-12 h-12 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 rounded-full flex items-center justify-center shadow-inner mb-4">
                <Cloud className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Accede a tu Despensa Cloud</h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Crea una cuenta en la nube para sincronizar tus alimentos y planes semanales en tu móvil y cualquier navegador en tiempo real.
              </p>

              {/* Tabs selector */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl my-6">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-wider cursor-pointer ${
                    !isSignUp ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-wider cursor-pointer ${
                    isSignUp ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-slate-900/60 transition-all text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-slate-900/60 transition-all text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  {authLoading ? (
                    <RefreshCw className="animate-spin w-4 h-4 text-white" />
                  ) : isSignUp ? (
                    "Crear cuenta Cloud"
                  ) : (
                    "Entrar / Vincular"
                  )}
                </button>
              </form>

              {/* Demo local Option */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">¿Quieres probar antes?</span>
                <button
                  onClick={() => {
                    setGuestMode(true);
                    triggerAlert("info", "Has entrado en Modo Invitado. Los datos se guardarán localmente.");
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold transition-all cursor-pointer"
                >
                  Probar Demo Local (Sin Registro)
                </button>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Accederás al modo de demostración. Los datos se guardarán localmente en el servidor pero no se sincronizarán con la nube.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950 py-12 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 space-y-4">
            <div className="flex justify-center items-center gap-2">
              <CookingPot className="w-4 h-4 text-emerald-500 animate-bounce" />
              <span className="font-sans font-black text-slate-300">Despensia</span>
            </div>
            <p>Despensia App 🍓 — Desarrollado por <strong>THC Labs</strong>. Proyecto indie y sin financiación externa. Si te gusta, colabora <a href="https://ko-fi.com/thclabs" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">apoyándonos en Ko-fi</a> o compartiendo la app.</p>
            <p className="text-[10px] text-slate-600">THC Labs 2026. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    );
  };

  // --- RENDER ---
  if (!session?.user && !guestMode) {
    return renderLandingPage();
  }

  return (
    <div id="despensia-container" className="min-h-screen bg-slate-50 text-slate-900 font-sans leading-normal">
      <style dangerouslySetInnerHTML={{ __html: getThemeStylesheet(activePantryTheme) }} />
      
      {/* HEADER DE LA APP */}
      <header id="main-header" className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-200 w-11 h-11 flex items-center justify-center overflow-hidden">
              {/* Falling ingredients */}
              <span className="absolute text-xs select-none pointer-events-none falling-ing-1">🥕</span>
              <span className="absolute text-xs select-none pointer-events-none falling-ing-2">🍅</span>
              <span className="absolute text-xs select-none pointer-events-none falling-ing-3">🥦</span>
              
              {/* Custom animated cooking pot */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 z-10">
                {/* Lid (Rattling) */}
                <g className="animate-lid">
                  <path d="M10 5h4" />
                  <path d="M12 3v2" />
                  <path d="M4 8h16" />
                  <path d="M5 8c0-1.5 1-3 3-3h8c2 0 3 1.5 3 3" />
                </g>
                {/* Pot body (rim & bowl) */}
                <path d="M2 11h20" />
                <path d="M19 11v7c0 2-2 3-4 3H9c-2 0-4-1-4-3v-7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Despensia</h1>
                {activePantry && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-emerald-600" /> {activePantry.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Gestión inteligente de alimentos y cocina en vivo</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-end">
            {/* CONTROL DE SINCRONIZACIÓN CLOUD / MÓVIL */}
            <div className="flex items-center gap-2">
              {!session?.user && guestMode && (
                <button
                  onClick={() => setGuestMode(false)}
                  className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider border border-slate-200 mr-1.5"
                  title="Cerrar el modo invitado y volver a la página de bienvenida"
                >
                  Volver a Inicio
                </button>
              )}
              {session?.user ? (
                <div className="flex items-center gap-2.5 bg-emerald-55 border border-emerald-100 px-3.5 py-1.5 rounded-xl shadow-2xs">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div className="text-left text-xs">
                    <p className="text-[9px] font-black uppercase text-emerald-900 tracking-widest flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-700" /> En la Nube
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px] font-mono leading-none m-0">{session.user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="ml-1 text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-800 hover:text-rose-900 px-2 py-1 rounded-lg font-extrabold transition-all cursor-pointer uppercase tracking-wider border border-rose-100"
                    title="Pausar sincronización cloud y volver a base de datos sandbox offline"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setShowAuthModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider hover:shadow-md"
                  title="Crea una cuenta para llevar tus ingredientes y planes al móvil u otros dispositivos en vivo"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Sincronizar Móvil</span>
                </button>
              )}
            </div>

            {/* ESTADÍSTICAS RÁPIDAS EN EL MARGEN */}
            <div className="flex items-center gap-2 sm:gap-3 py-1">
              <div className="bg-slate-100/70 border border-slate-100 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Despensa</span>
                <span className="text-sm font-bold text-slate-700">{activeInventory.length} items</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                <span className="text-xs text-amber-500 block uppercase font-bold tracking-wider">Alertas</span>
                <span className="text-sm font-bold text-amber-600">
                  {activeInventory.filter(it => it.quantity <= 150 && it.unit === 'g' || it.quantity <= 1 && it.unit === 'uds').length} críticas
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                <span className="text-xs text-emerald-500 block uppercase font-bold tracking-wider">Planeados</span>
                <span className="text-sm font-bold text-emerald-600">
                  {mealPlan.filter(p => p.status === "planned").length} menús
                </span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* NOTIFICACIONES FLOTANTES */}
      {alertMsg && (
        <div 
          id="alert-floating" 
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl shadow-2xl border transition-all duration-300 flex items-start gap-3 backdrop-blur-md animate-fade-in ${
            alertMsg.type === "success" 
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
              : alertMsg.type === "error"
              ? "bg-rose-50/95 border-rose-200 text-rose-800"
              : "bg-blue-50/95 border-blue-200 text-blue-800"
          }`}
        >
          <div className="mt-0.5">
            {alertMsg.type === "success" && <span className="text-lg">✅</span>}
            {alertMsg.type === "error" && <span className="text-lg">❌</span>}
            {alertMsg.type === "info" && <span className="text-lg">ℹ️</span>}
          </div>
          <div>
            <p className="font-semibold text-sm">Despensia Alerta</p>
            <p className="text-xs opacity-90">{alertMsg.text}</p>
          </div>
        </div>
      )}

      {/* INTERIOR DE LA PANTALLA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div id="tabs-navigation" className="bg-white p-1 rounded-xl shadow-xs border border-slate-100 flex gap-1 mb-8">
          <button
            id="tab-pantry-btn"
            onClick={() => setActiveTab("pantry")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "pantry"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <CookingPot className="w-4 h-4" />
            Gastronomía (Despensa)
          </button>
          
          <button
            id="tab-recipes-btn"
            onClick={() => setActiveTab("recipes")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "recipes"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Chef IA & Recetario
          </button>

          <button
            id="tab-planner-btn"
            onClick={() => setActiveTab("planner")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "planner"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Planificador Semanal
          </button>
        </div>


        {/* ==================================================================== */}
        {/* PESTAÑA: MI DESPENSA (PANTRY) */}
        {/* ==================================================================== */}
        {activeTab === "pantry" && (
          <div id="panel-pantry" className="space-y-8">
            {/* CABECERA Y SELECCIÓN DE DESPENSA */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shadow-2xs flex items-center justify-center">
                  <Warehouse className="w-6 h-6" style={{ color: getThemeHex(activePantryTheme) }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-800">{activePantry.name}</h2>
                    <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50" style={{ borderColor: getThemeHex(activePantryTheme) + '33', color: getThemeHex(activePantryTheme) }}>
                      Tema: {activePantryTheme}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Sincronizado y listo para formular menús</p>
                </div>
              </div>

              {/* Selector de Despensas y Acciones */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                <div className="relative w-full sm:w-48">
                  <select
                    value={activePantryId}
                    onChange={(e) => savePantries(pantries, e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-xs font-extrabold text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 transition-all cursor-pointer appearance-none"
                    style={{ focusRingColor: getThemeHex(activePantryTheme) }}
                  >
                    {pantries.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingPantryId(activePantryId);
                    setPantryForm({ name: activePantry.name, theme: activePantry.theme || "emerald" });
                    setShowPantryModal(true);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
                  title="Configurar / Renombrar despensa"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setEditingPantryId(null);
                    setPantryForm({ name: "", theme: "emerald" });
                    setShowPantryModal(true);
                  }}
                  className="bg-slate-800 text-slate-100 hover:bg-slate-700 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 border border-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Despensa
                </button>
              </div>
            </div>

            {/* ALERTAS CRÍTICAS DE STOCK BAJO */}
            {activeInventory.some(it => it.quantity <= 150 && it.unit === 'g' || it.quantity <= 1 && it.unit === 'uds') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Alimentos a punto de agotarse o vacíos de stock</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Te sugerimos reponer inteligentemente estos productos antes de que planifiques tu próxima receta:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeInventory
                      .filter(it => it.quantity <= 150 && it.unit === 'g' || it.quantity <= 1 && it.unit === 'uds')
                      .map(it => (
                        <span key={it.id} className="text-xs bg-white text-amber-800 px-2 py-1 rounded-md border border-amber-100 font-semibold shadow-xs">
                          ⚠️ {it.name}: {it.quantity} {it.unit}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* WIDGET LISTA DE LA COMPRA INTELIGENTE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
              <button
                onClick={() => setShowShoppingList(!showShoppingList)}
                className="w-full bg-slate-55 px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🛒</span>
                  <div>
                    <h3 className="font-bold text-slate-800">Lista de la Compra Inteligente</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Calcula automáticamente ingredientes faltantes o bajo stock</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {shoppingListItems.length > 0 && (
                    <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full">
                      {shoppingListItems.length} faltantes
                    </span>
                  )}
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {showShoppingList ? "Ocultar" : "Mostrar"}
                  </span>
                </div>
              </button>

              {showShoppingList && (
                <div className="p-6 space-y-6 animate-fade-in">
                  
                  {/* Selector de Despensas a incluir */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Incluir despensas en la lista:</label>
                    <div className="flex flex-wrap gap-2.5">
                      {pantries.map(p => {
                        const isChecked = selectedPantriesForList.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPantriesForList(prev => {
                                const updated = isChecked ? prev.filter(id => id !== p.id) : [...prev, p.id];
                                saveShoppingListMetadata(updated, customShoppingItems, shoppingCheckedItems);
                                return updated;
                              });
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                              isChecked 
                                ? "bg-slate-800 text-slate-100 border-slate-800" 
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getThemeHex(p.theme) }} />
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campo para añadir alimentos personalizados/manuales */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCustomShoppingItem.trim()) return;
                    if (!customShoppingItems.includes(newCustomShoppingItem.trim())) {
                      const updated = [...customShoppingItems, newCustomShoppingItem.trim()];
                      setCustomShoppingItems(updated);
                      saveShoppingListMetadata(selectedPantriesForList, updated, shoppingCheckedItems);
                    }
                    setNewCustomShoppingItem("");
                  }} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Añadir artículo manual a la lista..."
                      value={newCustomShoppingItem}
                      onChange={(e) => setNewCustomShoppingItem(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      className="bg-slate-850 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                    >
                      Añadir
                    </button>
                  </form>

                  {/* Listado de artículos a comprar */}
                  {shoppingListItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      🎉 ¡Todo al día! No quedan alimentos agotados o bajo stock en las despensas seleccionadas.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                        <span>Artículo</span>
                        <span>Acción</span>
                      </div>
                      
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                        {shoppingListItems.map(item => {
                          const isChecked = shoppingCheckedItems.includes(item.id);
                          return (
                            <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setShoppingCheckedItems(prev => 
                                      isChecked ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-slate-700 border-slate-300 accent-slate-700"
                                />
                                <span className={`font-semibold text-slate-850 ${isChecked ? "line-through text-slate-400" : ""}`}>
                                  {item.name}
                                </span>
                                {!item.isCustom && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                    Stock: {item.quantity} {item.unit}
                                  </span>
                                )}
                                <span className="text-[9px] px-2 py-0.5 rounded-full border font-bold" style={{ borderColor: getThemeHex(item.pantryTheme) + '44', color: getThemeHex(item.pantryTheme) }}>
                                  {item.pantryName}
                                </span>
                              </label>

                              <div className="flex items-center gap-1.5">
                                {item.isCustom ? (
                                  <button
                                    onClick={() => {
                                      const updated = customShoppingItems.filter(name => name !== item.name);
                                      setCustomShoppingItems(updated);
                                      saveShoppingListMetadata(selectedPantriesForList, updated, shoppingCheckedItems.filter(id => id !== item.id));
                                      setShoppingCheckedItems(prev => prev.filter(id => id !== item.id));
                                    }}
                                    className="text-rose-600 hover:underline font-bold text-[10px] px-2 py-1 hover:bg-rose-50 rounded"
                                  >
                                    Eliminar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRestockItem(item.id, item.unit === "g" || item.unit === "ml" ? 500 : 6)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded transition-colors"
                                  >
                                    Reponer {item.unit === "g" || item.unit === "ml" ? "+500g" : "+6 uds"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Botones de acción general */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomShoppingItems([]);
                            setShoppingCheckedItems([]);
                            saveShoppingListMetadata(selectedPantriesForList, [], []);
                            triggerAlert("info", "Lista de la compra reseteada.");
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Limpiar lista
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCopyShoppingList}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            Copiar Lista 📋
                          </button>
                          
                          {shoppingCheckedItems.length > 0 && (
                            <button
                              type="button"
                              onClick={handleCompletePurchase}
                              className="text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 animate-fade-in"
                              style={{ backgroundColor: getThemeHex(activePantryTheme) }}
                            >
                              Completar Compra ✅
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>

            {/* BARRA DE ACCIÓN SUPERIOR: BÚSQUEDA Y NUEVOS PRODUCTOS */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                {/* Input Búsqueda */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar alimento en tu despensa..."
                    value={pantrySearch}
                    onChange={(e) => setPantrySearch(e.target.value)}
                    className="w-full bg-slate-55 pl-9 pr-4 py-2 bg-slate-50/50 rounded-lg text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Filtro por Categorías */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={pantryFilter}
                    onChange={(e) => setPantryFilter(e.target.value)}
                    className="pl-8 pr-6 py-2 bg-slate-50/50 rounded-lg text-sm border border-slate-200 appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="Todos">Todas las categorías</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Ordenación de inventario */}
                <div className="relative">
                  <span className="text-[10px] uppercase font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">Ordenar:</span>
                  <select
                    value={pantrySortBy}
                    onChange={(e) => setPantrySortBy(e.target.value)}
                    className="pl-16 pr-8 py-2 bg-slate-50/50 rounded-lg text-sm border border-slate-200 appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer font-semibold text-slate-700"
                  >
                    <option value="name">Alfabético (A-Z)</option>
                    <option value="expiry">Caducidad (Próxima)</option>
                    <option value="quantity">Cantidad (Mayor)</option>
                  </select>
                </div>
              </div>

              {/* Botónes de acción */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                
                {/* Botón escanear ticket (📸 IA) */}
                <button
                  id="scan-ticket-trigger"
                  onClick={() => setShowScanner(true)}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center gap-2 border border-emerald-100 shadow-3xs transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Escanear Ticket 📸
                </button>

                {/* Botón Asistente de Perfil / Carga Rápida */}
                <button
                  onClick={() => {
                    setSelectedOnboardingAllergies(profilePrefs.allergies);
                    setSelectedOnboardingStyle(profilePrefs.cookingStyle);
                    setSelectedOnboardingStaples([]);
                    setOnboardingStep(1);
                    setShowOnboardingModal(true);
                  }}
                  className="bg-slate-800 text-slate-100 hover:bg-slate-700 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center gap-2 border border-slate-700 shadow-3xs transition-all active:scale-95 cursor-pointer"
                  title="Configurar alergias, gustos y carga masiva de ingredientes"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Ajustes Perfil ⭐
                </button>

                {/* Botón añadir alimento manual */}
                <button
                  onClick={() => {
                    setEditingFoodId(null);
                    setIsCategoryManuallySet(false);
                    setNewFood({ name: "", quantity: "", unit: "g", category: "Otros", expiryDate: "" });
                    setShowAddForm(true);
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Alimento
                </button>

              </div>
            </div>

            {/* FORMULARIO DE REPLEGADO PARA AÑADIR/EDITAR INGREDIENTE */}
            {showAddForm && (
              <div className="bg-white p-6 rounded-xl border-2 border-emerald-500 shadow-md animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-600" />
                    {editingFoodId ? "Editar Alimento de la Despensa" : "Registrar Alimento en Casa"}
                  </h3>
                  <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider">
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleAddFood} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Alimento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Arroz Integral"
                      value={newFood.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const suggested = suggestCategoryByName(val);
                        setNewFood(prev => ({
                          ...prev,
                          name: val,
                          category: !isCategoryManuallySet ? suggested : prev.category
                        }));
                      }}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad Física</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      placeholder="Ej. 1000"
                      value={newFood.quantity}
                      onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad Medida</label>
                    <select
                      value={newFood.unit}
                      onChange={(e) => setNewFood({ ...newFood, unit: e.target.value })}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    >
                      <option value="g">Gramos (g)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="uds">Unidades (uds)</option>
                      <option value="litros">Litros (litros)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                    <select
                      value={newFood.category}
                      onChange={(e) => {
                        setIsCategoryManuallySet(true);
                        setNewFood({ ...newFood, category: e.target.value });
                      }}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Caducidad</label>
                    <input
                      type="date"
                      value={newFood.expiryDate}
                      onChange={(e) => setNewFood({ ...newFood, expiryDate: e.target.value })}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-5 flex justify-end gap-3 mt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      {editingFoodId ? "Guardar Cambios" : "Guardar Alimento"}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* SECCIÓN ESCÁNER DE TICKETS (📸 MULTIMODIAL LIVE) */}
            {showScanner && (
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-md space-y-6 animate-fade-in relative">
                <button 
                  onClick={() => setShowScanner(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕ Cerrar Escáner
                </button>

                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    Asistente de Importación de Compras con Imagen
                  </h3>
                  <p className="text-xs text-slate-400">Nuestro motor Gemini analiza tickets del supermercado arrugados o digitales, clasifica las porciones y los carga en un paso.</p>
                </div>

                {/* Subir imagen física o usar ejemplos de simulación rápida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* UPLOAD FOTO */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500 transition-colors bg-slate-50/50">
                    <Upload className="w-10 h-10 text-slate-300" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Sube una foto real de tu ticket de compra</p>
                      <p className="text-xs text-slate-400 mt-1">Formatos permitidos: JPEG, PNG o WebP</p>
                    </div>
                    
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all">
                      Seleccionar Archivo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadTicketImage} 
                        className="hidden" 
                      />
                    </label>

                    {scanning && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span className="text-xs font-semibold text-emerald-700">{ticketTips}</span>
                      </div>
                    )}
                  </div>

                  {/* PROBAR CON MOCK DE ALTA FIDELIDAD */}
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Prueba instantánea rápida (Simulado con IA digital)
                    </p>
                    <p className="text-xs text-slate-400">Si estás probando desde la oficina y no tienes un ticket físico de ayer a mano, prueba nuestro simulador integrado para ver la potencia:</p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => useSampleTicket(SAMPLE_TICKET_MERCADONA)}
                        className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-700">Ticket de Compra Mercadona</p>
                          <p className="text-[10px] text-slate-400">Pollo, Tomate, Huevos, Arroz Integral</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => useSampleTicket(SAMPLE_TICKET_CARREFOUR)}
                        className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-700">Ticket de Compra Carrefour</p>
                          <p className="text-[10px] text-slate-400">Aguacate, Leche, Espinacas, Queso</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* BORRADOR DEL SCANNED TICKET */}
                {scannerDraft.length > 0 && (
                  <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block font-mono">Borrador de Alimentos Extraídos</span>
                      <span className="text-xs text-emerald-600 font-semibold">{scannerDraft.length} productos detectados</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {scannerDraft.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-emerald-100/50 flex flex-wrap items-center justify-between gap-3 shadow-3xs">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateDraftItem(idx, "name", e.target.value)}
                            className="bg-slate-50 font-semibold text-xs text-slate-800 p-1.5 rounded-md border border-slate-100 flex-1 min-w-[120px]"
                          />
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateDraftItem(idx, "quantity", e.target.value)}
                              className="bg-slate-50 font-bold text-xs text-slate-800 p-1.5 rounded-md border border-slate-100 w-16 text-center"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateDraftItem(idx, "unit", e.target.value)}
                              className="bg-slate-50 text-[11px] font-bold text-slate-600 p-1.5 rounded-md border border-slate-100 cursor-pointer"
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="uds">uds</option>
                              <option value="litros">litros</option>
                            </select>
                            <select
                              value={item.category}
                              onChange={(e) => handleUpdateDraftItem(idx, "category", e.target.value)}
                              className="bg-slate-50 text-[11px] font-semibold text-slate-600 p-1.5 rounded-md border border-slate-100 cursor-pointer"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e) => handleUpdateDraftItem(idx, "expiryDate", e.target.value)}
                              className="bg-slate-50 text-[11px] font-semibold text-slate-600 p-1.5 rounded-md border border-slate-100 cursor-pointer w-28"
                              title="Fecha de Caducidad estimada"
                            />
                          </div>

                          <button 
                            onClick={() => handleRemoveDraftItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setScannerDraft([])}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs"
                      >
                        Descartar todo
                      </button>
                      <button
                        onClick={handleImportScannerDraft}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Confirmar e importar a Despensa
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TABLA DE INVENTARIO FÍSICO */}
            {expiringItems.length > 0 && (
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">¡Alerta de Caducidad Inminente!</h4>
                    <p className="text-xs text-slate-500">Tienes {expiringItems.length} {expiringItems.length === 1 ? "alimento" : "alimentos"} que {expiringItems.length === 1 ? "ha caducado o está" : "han caducado o están"} a punto de caducar.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPantrySortBy("expiry");
                      triggerAlert("info", "Ordenando despensa por fecha de caducidad.");
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-1.5 px-3 rounded-lg shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Ver primero
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">Alimentos Registrados en Tu Casa</h3>
                  <p className="text-xs text-slate-400">Total en despensa: {activeInventory.length} alimentos listos para cocinar</p>
                </div>
                <button 
                  onClick={() => selectAllWithStock()} 
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Seleccionar todos en stock para receta
                </button>
              </div>

              {activeInventory.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <CookingPot className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-medium">No hay ingredientes registrados en tu despensa todavía.</p>
                  <p className="text-xs max-w-sm mx-auto">Prueba escaneando un ticket o agregándolos de forma rápida para empezar a formular tus menús.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 text-xs font-bold uppercase tracking-wider font-mono border-b border-slate-100">
                        <th className="py-3.5 px-6 table-cell">Propuesta</th>
                        <th className="py-3.5 px-6">Ingrediente</th>
                        <th className="py-3.5 px-6">Categoría</th>
                        <th className="py-3.5 px-6">Caducidad</th>
                        <th className="py-3.5 px-6 text-center">Disponible</th>
                        <th className="py-3.5 px-6 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 text-sm">
                      {activeInventory
                        .filter(food => {
                          const matchesSearch = food.name.toLowerCase().includes(pantrySearch.toLowerCase());
                          const matchesFilter = pantryFilter === "Todos" || food.category === pantryFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map(food => {
                          // Definir si está vacío o cerca d vaciarse
                          const isCritical = food.quantity <= 150 && food.unit === 'g' || food.quantity <= 1 && food.unit === 'uds';
                          const isSelected = selectedForRecipe.includes(food.name);

                          return (
                            <tr key={food.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-emerald-50/20" : ""}`}>
                              
                              {/* Checkbox para Chef Generador */}
                              <td className="py-4 px-6 w-12">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectForRecipe(food.name)}
                                  className="w-4.5 h-4.5 rounded text-emerald-600 focus:ring-emerald-500 filter hover:scale-105 transition-all cursor-pointer accent-emerald-600"
                                />
                              </td>

                              <td className="py-4 px-6 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <span>{food.name}</span>
                                  {isCritical && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                                      {food.quantity === 0 ? "Agotado" : "Bajo Stock"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-slate-500">
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                                  {food.category || "Otros"}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-slate-500">
                                {(() => {
                                  const status = getExpiryStatus(food.expiryDate);
                                  return (
                                    <span className={`px-2.5 py-1 rounded-md text-xs ${status.color}`}>
                                      {status.label}
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* Cantidad interactiva +/- */}
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-2.5">
                                  <button
                                    onClick={() => adjustQuantityQuick(food.id, food.quantity, -100, food.unit)}
                                    className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-400 active:scale-90"
                                    title="Restar 100g/ml"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  
                                  <span className={`font-mono font-bold text-slate-700 min-w-[60px] text-center ${isCritical ? "text-amber-600" : ""}`}>
                                    {food.quantity} {food.unit}
                                  </span>

                                  <button
                                    onClick={() => adjustQuantityQuick(food.id, food.quantity, 100, food.unit)}
                                    className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-400 active:scale-90"
                                    title="Sumar 100g/ml"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditClick(food)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition-colors"
                                    title="Editar alimento"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFood(food.id, food.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Eliminar de inventario"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}


        {/* ==================================================================== */}
        {/* PESTAÑA: CHEF IA & RECETARIO */}
        {/* ==================================================================== */}
        {activeTab === "recipes" && (
          <div id="panel-recipes" className="space-y-8 animate-fade-in">
            
            {/* SECCIÓN CREAR RECETAS CON INTELIGENCIA ARTIFICIAL */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
                <ChefHat className="w-72 h-72" />
              </div>

              <div className="max-w-3xl space-y-6">
                <div>
                  <span className="bg-emerald-500 text-emerald-50 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-emerald-400">
                    Sugerencias Inteligentes Gemini AI
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">Chef de Inteligencia Artificial</h2>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                    Cocina de reaprovechamiento. Marca alimentos de tu despensa arriba o selecciona abajo qué deseas usar y nuestra IA creará la receta perfecta.
                  </p>
                </div>

                {/* Selección interactiva flotante de ingredientes */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">Ingrediente(s) asignados para recetar ({selectedForRecipe.length})</span>
                  
                  {/* Selector y buscador inline de alimentos */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200" />
                        <input
                          type="text"
                          placeholder="Buscar o escribir ingrediente..."
                          value={chefSearchQuery}
                          onChange={(e) => {
                            setChefSearchQuery(e.target.value);
                            setShowChefSearchDropdown(true);
                          }}
                          onFocus={() => setShowChefSearchDropdown(true)}
                          onBlur={() => setTimeout(() => setShowChefSearchDropdown(false), 200)}
                          className="w-full pl-9 pr-4 py-2.5 bg-white/10 placeholder-emerald-200/75 border border-white/25 border-emerald-400 rounded-xl text-xs focus:outline-none focus:bg-white/20 focus:ring-1 focus:ring-emerald-400 transition-all text-white font-medium"
                        />
                      </div>
                      {chefSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = chefSearchQuery.trim();
                            if (!selectedForRecipe.some(s => s.toLowerCase() === val.toLowerCase())) {
                              setSelectedForRecipe(prev => [...prev, val]);
                            }
                            setChefSearchQuery("");
                          }}
                          className="bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                        >
                          Añadir Custom
                        </button>
                      )}
                    </div>

                    {showChefSearchDropdown && (
                      <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 divide-y divide-slate-750/50">
                        {(() => {
                          const filtered = activeInventory.filter(item => {
                            const alreadySelected = selectedForRecipe.some(sel => sel.toLowerCase() === item.name.toLowerCase());
                            const matchesQuery = item.name.toLowerCase().includes(chefSearchQuery.toLowerCase());
                            return !alreadySelected && matchesQuery;
                          });

                          return (
                            <>
                              {filtered.length > 0 ? (
                                filtered.map(item => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      if (!selectedForRecipe.includes(item.name)) {
                                        setSelectedForRecipe(prev => [...prev, item.name]);
                                      }
                                      setChefSearchQuery("");
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-700/60 text-slate-100 text-xs font-semibold flex items-center justify-between transition-colors"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                                      {item.name}
                                    </span>
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                                      {item.quantity} {item.unit}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-slate-400 text-xs italic">
                                  {chefSearchQuery.trim() ? "No se encontraron otros ingredientes en stock" : "Escribe para buscar ingredientes de tu despensa..."}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {selectedForRecipe.length === 0 ? (
                    <p className="text-xs text-emerald-200">⚠️ Ningún ingrediente seleccionado. Busca arriba o escribe para añadir alimentos personalizados para tu receta.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedForRecipe.map(name => (
                        <span key={name} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold transition-colors">
                          {name}
                          <button onClick={() => toggleSelectForRecipe(name)} className="text-emerald-300 hover:text-white text-sm font-extrabold focus:outline-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preferencias o restricciones extra */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">¿Alguna restricción o antojo de hoy? (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Escribe 'baja en grasas', 'sin freír', 'apto para niños', 'añade un toque de curry'..."
                    value={chefExtraPrompt}
                    onChange={(e) => setChefExtraPrompt(e.target.value)}
                    className="w-full bg-white/10 placeholder-emerald-200/75 border border-white/25 border-emerald-400 rounded-lg p-3 text-sm focus:outline-none focus:bg-white/25 transition-all text-white"
                  />
                </div>

                {/* Objetivos Nutricionales (Macros) */}
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider flex items-center gap-1.5">🎯 Ajustar Macronutrientes Objetivos (Opcional)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-200 block mb-1">Calorías (kcal)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={macroCal}
                        onChange={(e) => setMacroCal(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white/10 placeholder-emerald-200/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:bg-white/20 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-200 block mb-1">Proteínas (g)</label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={macroProt}
                        onChange={(e) => setMacroProt(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white/10 placeholder-emerald-200/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:bg-white/20 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-200 block mb-1">Carbos (g)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={macroCarb}
                        onChange={(e) => setMacroCarb(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white/10 placeholder-emerald-200/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:bg-white/20 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-200 block mb-1">Grasas (g)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15"
                        value={macroFat}
                        onChange={(e) => setMacroFat(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white/10 placeholder-emerald-200/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:bg-white/20 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Ingredientes exclusivos y caducidad checkboxes */}
                <div className="pt-1 space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-100 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useOnlyPantryIngredients}
                      onChange={(e) => setUseOnlyPantryIngredients(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-white/20 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Exclusivo: Usar únicamente los ingredientes seleccionados de mi despensa</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-100 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prioritizeExpiringIngredients}
                      onChange={(e) => setPrioritizeExpiringIngredients(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 border-white/20 accent-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      🍂 Priorizar ingredientes próximos a caducar <span className="text-[9px] bg-amber-500/35 text-amber-200 px-1.5 py-0.5 rounded font-mono font-black uppercase tracking-wide">Desperdicio Cero</span>
                    </span>
                  </label>
                </div>

                {/* Sugerencia de Receta Popular si coincide con ingredientes */}
                {popularMatch && (
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/25 rounded-lg text-emerald-300">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-emerald-300 tracking-wider">¡Receta popular compatible!</h4>
                        <p className="text-xs font-bold mt-0.5 text-white">
                          Tienes ingredientes para elaborar tu receta guardada <strong>"{popularMatch.recipe.title}"</strong> (coincidencia del {popularMatch.percentage}%).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setGeneratedRecipeDraft({
                            title: popularMatch.recipe.title,
                            ingredients_required: popularMatch.recipe.ingredients_required,
                            instructions: popularMatch.recipe.instructions,
                            macros_summary: popularMatch.recipe.macros_summary,
                            _cached: true
                          });
                          triggerAlert("success", `Cargada propuesta popular "${popularMatch.recipe.title}" sin consumo de cuota.`);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[10px] uppercase px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        Cargar Receta Guardada (0 tokens)
                      </button>
                    </div>
                  </div>
                )}

                {/* Acción de procesar */}
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    id="submit-ai-recipe"
                    disabled={generatingRecipe}
                    onClick={() => handleGenerateRecipeWithIA(false)}
                    className="bg-white text-emerald-800 disabled:bg-emerald-200 font-bold px-6 py-3 rounded-xl text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    {generatingRecipe && !selectedProposal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                        Ideando propuestas culinarias...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Formular Propuestas IA 🪄
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRecipeImporter(true)}
                    className="bg-emerald-700/60 hover:bg-emerald-700/80 text-white border border-emerald-500/50 font-bold px-4 py-3 rounded-xl text-sm transition-all"
                  >
                    Importar desde web o notas 📥
                  </button>
                </div>
              </div>
            </div>

            {/* MODAL / DRAWER IMPORTADOR RECETA EXTERNA */}
            {showRecipeImporter && (
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4 animate-fade-in relative">
                <button onClick={() => setShowRecipeImporter(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold">
                  ✕ Cerrar
                </button>
                <div className="border-b border-rose-100 pb-2">
                  <h3 className="font-bold text-slate-800">Importador Inteligente OCR/Texto de Recetas</h3>
                  <p className="text-xs text-slate-400">Pega capturas de blogs, enlaces copiados, folletos o ingredientes en prosa sin formatear. Gemini lo convertirá en una receta estructurada.</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Pega aquí la receta en sucio de internet o tu bloc de notas..."
                    value={importingText}
                    onChange={(e) => setImportingText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-emerald-500"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowRecipeImporter(false)} className="text-slate-500 text-xs font-bold uppercase py-2 px-3">
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportTextRecipe}
                      disabled={importingState}
                      className="bg-emerald-600 disabled:bg-emerald-300 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1"
                    >
                      {importingState ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Digerir e Importar con IA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LISTA DE PROPUESTAS DE RECETAS (PASO 1) */}
            {recipeProposals && !generatedRecipeDraft && (
              <div className="space-y-6 animate-fade-in bg-white/60 border border-slate-200/80 p-6 rounded-2xl shadow-xs">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    💡 Selecciona una propuesta del Chef IA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nuestro motor Gemini ha ideado 3 opciones diferentes basadas en tu despensa y tus objetivos nutricionales. Elige tu favorita para redactar la receta completa:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recipeProposals.map((proposal: any, idx: number) => {
                    let cardBorder = "border-emerald-250 bg-emerald-50/20";
                    let badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    let typeLabel = "🍂 Aprovechamiento";
                    
                    if (proposal.type === "supermercado") {
                      cardBorder = "border-amber-250 bg-amber-50/20";
                      badgeBg = "bg-amber-100 text-amber-800 border-amber-300";
                      typeLabel = "🛒 Súper Compra";
                    } else if (proposal.type === "innovar") {
                      cardBorder = "border-violet-250 bg-violet-50/20";
                      badgeBg = "bg-violet-100 text-violet-800 border-violet-300";
                      typeLabel = "✨ Innovación";
                    }

                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:scale-[1.01] transition-all duration-300 ${cardBorder} relative overflow-hidden group`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                              {typeLabel}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block tracking-wider mb-0.5 uppercase">{proposal.tagline}</span>
                            <h4 className="text-base font-extrabold text-slate-800 group-hover:text-amber-800 transition-colors leading-tight">
                              {proposal.title}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {proposal.description}
                          </p>

                          {proposal.missingIngredients && proposal.missingIngredients.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">A comprar / Añadir:</span>
                              <div className="flex flex-wrap gap-1">
                                {proposal.missingIngredients.map((ing: string, i: number) => (
                                  <span key={i} className="text-[9px] font-bold bg-rose-50/50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    + {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => handleExpandProposal(proposal)}
                            disabled={generatingRecipe}
                            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:bg-slate-300"
                          >
                            {generatingRecipe && selectedProposal?.title === proposal.title ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Redactando receta...
                              </>
                            ) : (
                              <>
                                Cocinar esta receta 🍳
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PROPUESTA GENERADA PENDIENTE DE REVISIÓN */}
            {generatedRecipeDraft && (
              <div className="bg-amber-50/50 rounded-2xl border-2 border-amber-300 p-6 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {generatedRecipeDraft._cached ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                        ⚡ Caché Instantánea
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider">Revisión Culinaria IA</span>
                    )}
                    <h3 className="text-xl font-bold text-slate-800">{generatedRecipeDraft.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    🍕 {generatedRecipeDraft.macros_summary}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Ingredientes estructurados */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Ingredientes Exigidos:</span>
                    <ul className="divide-y divide-amber-200/50">
                      {generatedRecipeDraft.ingredients_required.map((itm: any, index: number) => (
                        <li key={index} className="py-2 text-xs flex justify-between items-center text-slate-700">
                          <span className="font-semibold">{itm.name}</span>
                          <span className="bg-white/80 border border-amber-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                            {itm.quantity} {itm.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instrucciones */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Instrucciones de Elaboración:</span>
                    <div className="bg-white/75 border border-amber-200 p-4 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed min-h-[140px]">
                      {generatedRecipeDraft.instructions}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end gap-3 border-t border-amber-200 pt-4 flex-wrap">
                  {recipeProposals && (
                    <button
                      onClick={() => {
                        setGeneratedRecipeDraft(null);
                        setSelectedProposal(null);
                      }}
                      className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-3xs active:scale-95 transition-all cursor-pointer mr-auto"
                    >
                      🔙 Volver a propuestas
                    </button>
                  )}
                  {generatedRecipeDraft._cached && (
                    <button
                      onClick={() => {
                        if (selectedProposal) {
                          handleExpandProposal(selectedProposal, true);
                        } else {
                          handleGenerateRecipeWithIA(true);
                        }
                      }}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-3xs active:scale-95 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Forzar Nueva Generación IA
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setGeneratedRecipeDraft(null);
                      setSelectedProposal(null);
                      setRecipeProposals(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveRecipeDraft}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Guardar en mi Recetario
                  </button>
                </div>
              </div>
            )}


            {/* MENÚ DE RECETARIO GUARDADO */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Mi Catálogo de Recetas
                </h3>
                <p className="text-xs text-slate-400">Tu repertorio alimentario completo. Consulta ingredientes, macros e inicia la cocina live para asistencia en tiempo real.</p>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-100 shadow-3xs space-y-2">
                  <ChefHat className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-medium">Tu recetario está vacío temporalmente.</p>
                  <p className="text-xs">Usa el Chef IA arriba aportando tus alimentos de hoy para poblarlo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recipes.map(recipe => {
                    // Consultar stock de ingredientes
                    const status = checkIngredientStatus(recipe);
                    
                    return (
                      <div 
                        key={recipe.id} 
                        className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                      >
                        
                        {/* Cabecera / Imagen con Multimedia */}
                        <div className="relative h-44 bg-emerald-900/10 min-h-[176px] flex items-center justify-center text-center overflow-hidden">
                          {recipe.cover_url ? (
                            <img 
                              src={recipe.cover_url} 
                              alt={recipe.title} 
                              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="p-4 space-y-3">
                              <ImageIcon className="w-8 h-8 text-emerald-600/50 mx-auto" />
                              <button 
                                onClick={() => handleGenerateRecipeCover(recipe)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase py-1 px-3 rounded-md shadow-3xs flex items-center gap-1 mx-auto"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" /> Generar Foto Gourmet
                              </button>
                            </div>
                          )}

                          {/* Float Badge de Macros */}
                          {recipe.macros_summary && (
                            <span className="absolute bottom-3 left-3 bg-slate-900/85 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                              🔥 {recipe.macros_summary}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteRecipe(recipe.id, recipe.title)}
                            className="absolute top-3 right-3 p-1.5 bg-white/75 hover:bg-white text-rose-600 rounded-lg shadow-xs transition-colors"
                            title="Eliminar receta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Contenido / Checklist de compras */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-slate-800 text-lg leading-snug tracking-tight">{recipe.title}</h4>
                            
                            {/* Estado Comparado despensa */}
                            <div className="pt-1">
                              {status.allAvailable ? (
                                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-fit border border-emerald-100">
                                  <CheckSquare className="w-3 h-3 text-emerald-600" /> ¡Materia prima al completo! Listo para cocinar
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-fit border border-amber-100">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Te faltan {status.missing.length} componentes
                                  </span>
                                  <p className="text-[10px] text-slate-400 font-medium">No dispones de: <span className="text-amber-600 font-bold">{status.missing.join(", ")}</span></p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vista resumen del listado de ingredientes */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ingredientes:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recipe.ingredients_required.map((it: any, i: number) => (
                                <span key={i} className="text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold font-mono">
                                  {it.name} ({it.quantity}{it.unit})
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Botón de Lanzamiento de Modo Cocinar Live y Me Gusta */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => startLiveCookingMode(recipe)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" /> Iniciar Cocina Live 👨‍🍳
                            </button>
                            <button
                              onClick={() => handleLikeRecipe(recipe.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-xs px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                              title="Dar me gusta"
                            >
                              <span>❤️</span>
                              <span className="font-mono text-[10px]">{recipe.likes || 0}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}


        {/* ==================================================================== */}
        {/* PANEL: MODO COCINA LIVE (MULTIPASO CON TIMERS) */}
        {/* ==================================================================== */}
        {liveRecipe && (
          <LiveCookingModal
            liveRecipe={liveRecipe}
            setLiveRecipe={setLiveRecipe}
            livePlannedItem={livePlannedItem}
            setLivePlannedItem={setLivePlannedItem}
            completedSteps={completedSteps}
            setCompletedSteps={setCompletedSteps}
            liveCurrentStep={liveCurrentStep}
            setLiveCurrentStep={setLiveCurrentStep}
            cookingTimeLeft={cookingTimeLeft}
            setCookingTimeLeft={setCookingTimeLeft}
            cookingTimerActive={cookingTimerActive}
            setCookingTimerActive={setCookingTimerActive}
            cookingTimerOriginalValue={cookingTimerOriginalValue}
            liveIngredientsToConsume={liveIngredientsToConsume}
            handleFinishCooking={handleFinishCooking}
            loading={loading}
            triggerAlert={triggerAlert}
            parseStepTimer={parseStepTimer}
            formatTimerValue={formatTimerValue}
            adjustLiveQtyToConsume={adjustLiveQtyToConsume}
            handleLiveQtyInputChange={handleLiveQtyInputChange}
            navigateLiveStep={navigateLiveStep}
            handleStepCheckbox={handleStepCheckbox}
          />
        )}


        {/* ==================================================================== */}
        {/* PESTAÑA: PLANIFICADOR DE MENÚS (WEEKLY PLANNER WITH DIRECT EFFECT REGULATORY) */}
        {/* ==================================================================== */}
        {activeTab === "planner" && (
          <div id="panel-planner" className="space-y-8 animate-fade-in">
            
            {/* CABECERA Y NAVEGACIÓN DE FECHAS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Planificador de Menús Anual</h3>
                  <p className="text-xs text-slate-400">
                    Semana del <span className="font-bold text-slate-600">{formatDateLabel(weekDates[0])}</span> al <span className="font-bold text-slate-600">{formatDateLabel(weekDates[6])}</span> ({weekDates[0].getFullYear()})
                  </p>
                </div>
              </div>

              {/* Controles de Navegación */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentWeekDate);
                    prev.setDate(currentWeekDate.getDate() - 7);
                    setCurrentWeekDate(prev);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                  title="Semana anterior"
                >
                  ◀
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentWeekDate(new Date())}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Hoy 📅
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentWeekDate);
                    next.setDate(currentWeekDate.getDate() + 7);
                    setCurrentWeekDate(next);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                  title="Semana siguiente"
                >
                  ▶
                </button>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={formatLocalDate(currentWeekDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split("-").map(Number);
                        setCurrentWeekDate(new Date(y, m - 1, d));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoalsEditor(!showGoalsEditor)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-250 flex items-center gap-1 active:scale-95 border cursor-pointer ${
                    showGoalsEditor 
                      ? "bg-amber-600 border-amber-600 text-white shadow-sm" 
                      : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  ⚙️ Objetivos
                </button>
              </div>
            </div>

            {/* EDITOR AVANZADO DE OBJETIVOS (COLAPSABLE) */}
            {showGoalsEditor && (
              <div className="bg-amber-50/20 p-6 rounded-2xl border border-amber-100/70 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                    🎯 Configuración Avanzada: Objetivos Nutricionales Diarios
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                    Autoguardado Local
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Calorías Diarias (kcal)</label>
                    <input
                      type="number"
                      min="0"
                      value={macroGoals.calories || ""}
                      onChange={(e) => setMacroGoals(prev => ({ ...prev, calories: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full bg-white p-2.5 border border-amber-200 rounded-lg text-sm font-extrabold text-slate-800 focus:outline-amber-500 shadow-3xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Proteínas (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={macroGoals.protein || ""}
                      onChange={(e) => setMacroGoals(prev => ({ ...prev, protein: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full bg-white p-2.5 border border-amber-200 rounded-lg text-sm font-extrabold text-slate-800 focus:outline-amber-500 shadow-3xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Carbohidratos (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={macroGoals.carbs || ""}
                      onChange={(e) => setMacroGoals(prev => ({ ...prev, carbs: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full bg-white p-2.5 border border-amber-200 rounded-lg text-sm font-extrabold text-slate-800 focus:outline-amber-500 shadow-3xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Grasas (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={macroGoals.fat || ""}
                      onChange={(e) => setMacroGoals(prev => ({ ...prev, fat: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full bg-white p-2.5 border border-amber-200 rounded-lg text-sm font-extrabold text-slate-800 focus:outline-amber-500 shadow-3xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-700 italic">
                  💡 Tip: Estos valores definirán las barras de progreso individuales que verás en la parte inferior de cada día en el planificador semanal.
                </p>
              </div>
            )}

            {/* FORMULARIO DE AGENDADO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  ➕ Programar Plato en Calendario
                </h4>
                <p className="text-xs text-slate-400">Escoge la fecha de agendado, el tipo de comida y vincula una de tus recetas guardadas.</p>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-rose-50 text-rose-800 py-3.5 px-4 rounded-xl text-xs border border-rose-100 font-semibold">
                  ⚠️ Necesitas registrar al menos una receta en tu catálogo antes de poder programar.
                </div>
              ) : (
                <form onSubmit={handleAddToPlan} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de agendado</label>
                    <input
                      type="date"
                      required
                      value={selectedPlannerDate}
                      onChange={(e) => setSelectedPlannerDate(e.target.value)}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Momento alimentación</label>
                    <select
                      value={selectedPlannerMeal}
                      onChange={(e) => setSelectedPlannerMeal(e.target.value)}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    >
                      {MEAL_TYPES.map(meal => (
                        <option key={meal} value={meal}>{meal}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-mono">Asignar receta guardada</label>
                      <select
                        required
                        value={selectedRecipeForPlan}
                        onChange={(e) => setSelectedRecipeForPlan(e.target.value)}
                        className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                      >
                        <option value="">Selecciona una receta...</option>
                        {recipes.map(rec => (
                          <option key={rec.id} value={rec.id}>{rec.title}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg text-sm shadow-sm flex items-center gap-1 min-w-[120px] justify-center active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Agendar
                    </button>
                  </div>

                </form>
              )}
            </div>

            {/* CUADRICULA SEMANAL DE MENÚS */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDates.map(dateObj => {
                const dateStr = formatLocalDate(dateObj);
                const dayMeals = mealPlan.filter((p: any) => p.date === dateStr);
                const dayName = getWeekDayNameEs(dateObj);
                const dateLabel = formatDateLabel(dateObj);
                
                const dayMacros = weekMacrosTotals[dateStr] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
                
                const calPercent = Math.min(100, macroGoals.calories > 0 ? (dayMacros.calories / macroGoals.calories) * 100 : 0);
                const protPercent = Math.min(100, macroGoals.protein > 0 ? (dayMacros.protein / macroGoals.protein) * 100 : 0);
                const carbPercent = Math.min(100, macroGoals.carbs > 0 ? (dayMacros.carbs / macroGoals.carbs) * 100 : 0);
                const fatPercent = Math.min(100, macroGoals.fat > 0 ? (dayMacros.fat / macroGoals.fat) * 100 : 0);

                const isToday = formatLocalDate(new Date()) === dateStr;

                return (
                  <div 
                    key={dateStr} 
                    className={`rounded-2xl border transition-all flex flex-col h-full min-h-[380px] overflow-hidden ${
                      isToday 
                        ? "bg-amber-50/20 border-amber-300 shadow-md ring-1 ring-amber-300/20" 
                        : "bg-white border-slate-100 shadow-3xs hover:border-slate-200"
                    }`}
                  >
                    {/* Header Día */}
                    <div className={`px-3 py-2 text-center border-b flex items-center justify-between ${
                      isToday ? "bg-amber-500/10 border-amber-100 text-amber-900" : "bg-slate-100/50 border-slate-100 text-slate-700"
                    }`}>
                      <div className="text-left">
                        <span className="font-extrabold text-xs block leading-tight">{dayName}</span>
                        <span className="text-[9px] text-slate-400 font-bold block">{dateLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {dayMeals.length > 0 && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black font-mono ${
                            isToday ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            {dayMeals.length}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlannerDate(dateStr);
                            triggerAlert("info", `Fecha cambiada a ${dayName} (${dateStr}). Usa el panel superior para agendar.`);
                            document.getElementById("panel-planner")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Programar plato para este día"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Menús listados del día */}
                    <div className="p-3 flex-1 space-y-3 overflow-y-auto max-h-[250px] divide-y divide-slate-100/60">
                      {dayMeals.length === 0 ? (
                        <p className="text-[10px] text-slate-400 py-16 text-center italic">Vacío</p>
                      ) : (
                        dayMeals.map((planned: any) => {
                          const recipe = recipes.find(r => r.id === planned.recipe_id);
                          const isConsumed = planned.status === "consumed";

                          return (
                            <div key={planned.id} className="pt-2 text-left space-y-1.5 first:pt-0">
                              
                              <div className="flex items-center justify-between">
                                <span className="bg-emerald-50 text-emerald-800 text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md border border-emerald-100/50 uppercase">
                                  {planned.meal_type}
                                </span>
                                
                                <button
                                  onClick={() => handleRemoveFromPlan(planned.id)}
                                  className="text-rose-450 hover:text-rose-600 p-0.5 rounded font-bold text-xs cursor-pointer"
                                  title="Quitar de planificación"
                                >
                                  ×
                                </button>
                              </div>

                              <h5 className="text-[11px] font-black text-slate-800 leading-snug">{recipe?.title || "Receta no disponible"}</h5>
                              
                              {recipe && (
                                <div className="space-y-1.5">
                                  {recipe.macros_summary && (
                                    <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">
                                      {recipe.macros_summary}
                                    </p>
                                  )}
                                  
                                  {isConsumed ? (
                                    <span className="bg-slate-105 text-slate-400 text-[9px] font-semibold py-1 rounded-lg flex items-center justify-center gap-0.5 border border-slate-150">
                                      ✓ Consumido
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => startLiveCookingMode(recipe, planned)}
                                      disabled={loading}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] py-1 rounded-lg border border-emerald-500 shadow-3xs flex items-center justify-center gap-0.5 active:scale-95 transition-all text-center uppercase tracking-wider block cursor-pointer"
                                      title="Iniciar preparación guiada y controlar merma de stock en vivo"
                                    >
                                      🍳 Cocinar
                                    </button>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Macros */}
                    {dayMeals.length > 0 && (
                      <div className="bg-slate-50/80 p-2.5 border-t border-slate-100 space-y-1.5 text-[9px] font-bold mt-auto">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-slate-700">
                            <span>Calorías:</span>
                            <span className="font-extrabold">{dayMacros.calories} / {macroGoals.calories} kcal</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                dayMacros.calories > macroGoals.calories 
                                  ? "bg-rose-500 animate-pulse" 
                                  : calPercent > 90 
                                  ? "bg-amber-600" 
                                  : "bg-emerald-600"
                              }`}
                              style={{ width: `${calPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100/50 text-[8px] text-slate-500 leading-none">
                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>P:</span>
                              <span className="font-extrabold text-slate-700">{dayMacros.protein}/{macroGoals.protein}g</span>
                            </div>
                            <div className="w-full bg-slate-250 rounded-full h-1">
                              <div className="bg-amber-500 h-full" style={{ width: `${protPercent}%` }} />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>C:</span>
                              <span className="font-extrabold text-slate-700">{dayMacros.carbs}/{macroGoals.carbs}g</span>
                            </div>
                            <div className="w-full bg-slate-250 rounded-full h-1">
                              <div className="bg-orange-400 h-full" style={{ width: `${carbPercent}%` }} />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>G:</span>
                              <span className="font-extrabold text-slate-700">{dayMacros.fat}/{macroGoals.fat}g</span>
                            </div>
                            <div className="w-full bg-slate-250 rounded-full h-1">
                              <div className="bg-yellow-600 h-full" style={{ width: `${fatPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-16 text-center text-xs text-slate-400 font-medium font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p>Despensia App 🍓 — Desarrollado por <strong>THC Labs</strong>.</p>
          <p className="text-[10px] text-slate-450 leading-relaxed">Este es un proyecto independiente (indie) desarrollado sin financiación. Si te gusta y deseas colaborar, ¡<a href="https://ko-fi.com/thclabs" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-bold">apóyanos en Ko-fi</a> o comparte la app!</p>
          <p className="text-[9px] text-slate-300">THC Labs 2026. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* MODAL DE AUTENTICACIÓN CLOUD / MÓVIL SUPABASE */}
      {showAuthModal && (
        <div id="auth-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthEmail("");
                setAuthPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-black p-1 hover:bg-slate-50 rounded-full cursor-pointer"
              title="Cerrar ventana"
            >
              ✕
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Sincroniza tu Despensa</h3>
              <p className="text-xs text-slate-400 px-4">
                Lleva tus alimentos y menús semanales a tu móvil o cualquier navegador de forma instantánea.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-850"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider disabled:opacity-50 select-none flex items-center justify-center gap-1.5 active:scale-98"
              >
                {authLoading ? (
                  <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                ) : isSignUp ? (
                  "Crear Cuenta Sincronizada"
                ) : (
                  "Iniciar Sesión / Vincular"
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer transition-colors"
              >
                {isSignUp ? "¿Ya tienes una cuenta vinculada? Inicia Sesión" : "¿No tienes una cuenta aún? Regístrate gratis"}
              </button>
            </div>
            
            {!session && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100/50 rounded-xl text-center space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center justify-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  Acceso Demo Rápido
                </p>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Puedes registrarte con cualquier correo inventado o real como <strong className="font-semibold select-all text-slate-600">didacwm@gmail.com</strong> para simular el multiusuario listo para móviles instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL DE GESTIÓN DE DESPENSA */}
      {showPantryModal && (
        <div id="pantry-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl relative animate-fade-in text-left">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Warehouse className="w-5 h-5" style={{ color: getThemeHex(pantryForm.theme) }} />
              {editingPantryId && editingPantryId !== "new" && editingPantryId !== "default" ? "Editar Despensa" : "Nueva Despensa"}
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!pantryForm.name.trim()) {
                triggerAlert("error", "Por favor ingresa un nombre para la despensa.");
                return;
              }

              if (editingPantryId && editingPantryId !== "new") {
                // Rename or update existing pantry
                const updatedPantries = pantries.map(p => 
                  p.id === editingPantryId ? { ...p, name: pantryForm.name.trim(), theme: pantryForm.theme } : p
                );
                await savePantries(updatedPantries, editingPantryId);
                triggerAlert("success", "Despensa actualizada correctamente.");
              } else {
                // Create a new pantry
                const newId = "pantry_" + Date.now();
                const updatedPantries = [...pantries, { id: newId, name: pantryForm.name.trim(), theme: pantryForm.theme }];
                await savePantries(updatedPantries, newId);
                triggerAlert("success", `Despensa "${pantryForm.name}" creada y seleccionada.`);
              }
              setShowPantryModal(false);
            }} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Nombre de la Despensa</label>
                <input
                  type="text"
                  placeholder="Ej: Despensa Playa, Oficina, Casa..."
                  value={pantryForm.name}
                  onChange={(e) => setPantryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Tema de Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: "emerald", name: "Esmeralda", hex: "#10b981" },
                    { id: "amber", name: "Ámbar", hex: "#f59e0b" },
                    { id: "rose", name: "Rosa", hex: "#f43f5e" },
                    { id: "indigo", name: "Índigo", hex: "#6366f1" },
                    { id: "violet", name: "Violeta", hex: "#8b5cf6" }
                  ].map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setPantryForm(prev => ({ ...prev, theme: color.id }))}
                      className={`h-10 rounded-xl flex items-center justify-center border-2 transition-all relative hover:scale-105 active:scale-95 cursor-pointer`}
                      style={{
                        backgroundColor: color.hex,
                        borderColor: pantryForm.theme === color.id ? "#1e293b" : "transparent"
                      }}
                      title={color.name}
                    >
                      {pantryForm.theme === color.id && (
                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                {editingPantryId && editingPantryId !== "default" && editingPantryId !== "new" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setShowPantryModal(false);
                      await handleDeletePantry(editingPantryId);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPantryModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN DE PERFIL Y ONBOARDING */}
      {showOnboardingModal && (
        <div id="onboarding-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-100 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas cerrar el asistente? Puedes abrirlo en cualquier momento desde la Despensa.")) {
                  setShowOnboardingModal(false);
                }
              }}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 text-sm font-black p-1 hover:bg-slate-50 rounded-full cursor-pointer"
              title="Cerrar asistente"
            >
              ✕
            </button>

            {/* Stepper Header */}
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" />
                Asistente de Bienvenida de Despensia
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configura tu dieta y reabastece tu despensa inicial en 3 sencillos pasos.</p>
              
              {/* Step indicator */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      onboardingStep >= step ? "bg-emerald-600" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 font-mono">
                <span className={onboardingStep === 1 ? "text-emerald-700 font-extrabold" : "text-slate-400"}>1. Alergias</span>
                <span className={onboardingStep === 2 ? "text-emerald-700 font-extrabold" : "text-slate-400"}>2. Estilo Cocina</span>
                <span className={onboardingStep === 3 ? "text-emerald-700 font-extrabold" : "text-slate-400"}>3. Básicos Despensa</span>
              </div>
            </div>

            {/* Step 1: Dieta y Alergias */}
            {onboardingStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans">Paso 1: ¿Tienes alguna restricción o alérgenos?</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">El Chef IA de Gemini los excluirá estrictamente al sugerirte recetas.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALLERGY_OPTIONS.map((opt) => {
                    const isSelected = selectedOnboardingAllergies.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedOnboardingAllergies(prev => 
                            prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                          );
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                          isSelected 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-xs font-bold leading-tight">{opt.label}</span>
                        {isSelected && <span className="text-[10px] text-emerald-600 font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Alérgenos e intolerancias personalizadas */}
                <div className="space-y-2 border-t border-slate-100 pt-4 text-left">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Otros alérgenos o restricciones personalizadas
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: fresas, cebolla, ajo, piña (separados por comas)"
                    value={customOnboardingAllergies}
                    onChange={(e) => setCustomOnboardingAllergies(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800 placeholder-slate-400 font-sans"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    Escribe cualquier ingrediente adicional que quieras excluir. Gemini Chef los eliminará de las sugerencias.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Gustos y Estilo de Cocina */}
            {onboardingStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans">Paso 2: ¿Cuál es tu estilo preferido de cocina?</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">Ayuda al Chef IA a priorizar sugerencias que se adapten a tu día a día.</p>
                </div>
                <div className="space-y-2">
                  {STYLE_OPTIONS.map((opt) => {
                    const isSelected = selectedOnboardingStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOnboardingStyle(opt.id)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all active:scale-99 ${
                          isSelected 
                            ? "bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-2xs" 
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 bg-slate-100 rounded-lg">{opt.emoji}</span>
                          <div>
                            <p className="text-xs font-black text-slate-850 font-sans">{opt.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-sans">{opt.desc}</p>
                          </div>
                        </div>
                        <input 
                          type="radio" 
                          checked={isSelected} 
                          onChange={() => {}} 
                          className="accent-emerald-600 w-4 h-4 cursor-pointer" 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Básicos Despensa */}
            {onboardingStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans">Paso 3: Carga rápida de tu despensa</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">Marca los ingredientes que sueles tener en casa para añadirlos todos de una sola vez.</p>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-4 pr-1.5">
                  {["Especias & Aceites", "Granos & Secos", "Frescos Básicos"].map((groupName) => {
                    const groupItems = BASIC_INGREDIENT_OPTIONS.filter(x => x.categoryGroup === groupName);
                    return (
                      <div key={groupName} className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">{groupName}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupItems.map((item) => {
                            const isChecked = selectedOnboardingStaples.includes(item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => {
                                  setSelectedOnboardingStaples(prev => 
                                    prev.includes(item.name) ? prev.filter(x => x !== item.name) : [...prev, item.name]
                                  );
                                }}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all active:scale-98 text-xs font-bold ${
                                  isChecked 
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                                    : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span className="truncate">{item.name}</span>
                                <span className="bg-slate-100 text-slate-500 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">
                                  {item.quantity}{item.unit}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                disabled={onboardingStep === 1 || loading}
                onClick={() => setOnboardingStep(prev => prev - 1)}
                className="text-xs font-bold text-slate-400 hover:text-slate-655 disabled:opacity-50 uppercase tracking-wider py-2 px-3 cursor-pointer"
              >
                Atrás
              </button>

              {onboardingStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-md uppercase tracking-wider active:scale-95 transition-all cursor-pointer animate-fade-in"
                >
                  Siguiente paso
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveOnboarding}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-md uppercase tracking-wider active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin w-3.5 h-3.5" />
                  ) : (
                    "Finalizar y Guardar"
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      
      {guestMode && (
        <div className="hidden" /> // placeholder
      )}

    </div>
  );
}
