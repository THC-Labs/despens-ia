/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import {
  Carrot,
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
  Smartphone
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

// Tickets de ejemplo codificados en Base64 de forma abreviada para simulación y pruebas directas
const SAMPLE_TICKET_MERCADONA = {
  name: "Ticket Mercadona (Pollo y Tomates)",
  items: [
    { name: "Pechuga de Pollo", quantity: 500, unit: "g", category: "Carnes" },
    { name: "Tomates frescos", quantity: 6, unit: "uds", category: "Verduras/Frutas" },
    { name: "Huevos Orgánicos", quantity: 12, unit: "uds", category: "Lácteos/Huevos" },
    { name: "Arroz Integral", quantity: 1000, unit: "g", category: "Granos/Cereales" }
  ]
};

const SAMPLE_TICKET_CARREFOUR = {
  name: "Ticket Carrefour (Aguacate y Lácteos)",
  items: [
    { name: "Aguacate Maduro", quantity: 4, unit: "uds", category: "Verduras/Frutas" },
    { name: "Leche Semidesnatada", quantity: 1000, unit: "ml", category: "Lácteos/Huevos" },
    { name: "Queso Fresco", quantity: 250, unit: "g", category: "Lácteos/Huevos" },
    { name: "Espinacas frescas", quantity: 300, unit: "g", category: "Verduras/Frutas" }
  ]
};

const ALLERGY_OPTIONS = [
  { id: "Gluten", label: "Sin Gluten", emoji: "🌾" },
  { id: "Lactosa", label: "Sin Lactosa", emoji: "🥛" },
  { id: "FrutosSecos", label: "Frutos Secos", emoji: "🥜" },
  { id: "Huevo", label: "Sin Huevo", emoji: "🥚" },
  { id: "Mariscos", label: "Mariscos", emoji: "🦐" },
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

export default function App() {
  // Pestañas principal: 'pantry' | 'recipes' | 'planner'
  const [activeTab, setActiveTab] = useState<"pantry" | "recipes" | "planner">("pantry");

  // --- ESTADOS ---
  const [inventory, setInventory] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [mealPlan, setMealPlan] = useState<any[]>([]);

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

  // --- FILTROS Y BÚSQUEDAS ---
  const [pantrySearch, setPantrySearch] = useState("");
  const [pantryFilter, setPantryFilter] = useState("Todos");

  // --- GESTIÓN MANUAL INVENTARIO ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    quantity: "",
    unit: "g",
    category: "Verduras/Frutas"
  });
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  // --- ESCANER DE TICKETS IA ---
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerDraft, setScannerDraft] = useState<any[]>([]);
  const [ticketTips, setTicketTips] = useState("Listo para analizar...");

  // --- CHEF IA: GENERADOR ---
  const [selectedForRecipe, setSelectedForRecipe] = useState<string[]>([]);
  const [chefExtraPrompt, setChefExtraPrompt] = useState("");
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [generatedRecipeDraft, setGeneratedRecipeDraft] = useState<any | null>(null);

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

        setInventory(resInv.data || []);
        setRecipes(resRec.data || []);
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

          setInventory(inv);
          setRecipes(rec);
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
  const [selectedOnboardingStyle, setSelectedOnboardingStyle] = useState<string>("Saludable y Fitness");
  const [selectedOnboardingStaples, setSelectedOnboardingStaples] = useState<string[]>([]);

  const handleSaveOnboarding = async () => {
    setLoading(true);
    try {
      const payloadPrefs = {
        allergies: selectedOnboardingAllergies,
        preferences: [],
        cookingStyle: selectedOnboardingStyle
      };

      if (session?.user) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            allergies: selectedOnboardingAllergies,
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
              category: item.category,
              user_id: session.user.id,
              last_updated: new Date().toISOString()
            };
          } else {
            return {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category
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
      if (session?.user) {
        // --- MODO SUPABASE CLOUD SYNC ---
        if (editingFoodId) {
          const { error } = await supabase
            .from("inventory")
            .update({
              name: newFood.name,
              quantity: parseFloat(newFood.quantity),
              unit: newFood.unit,
              category: newFood.category,
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
              category: newFood.category,
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
              category: newFood.category
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
              category: newFood.category
            })
          });
          if (res.ok) {
            triggerAlert("success", `Alimento "${newFood.name}" añadido a tu despensa.`);
          }
        }
      }

      setNewFood({ name: "", quantity: "", unit: "g", category: "Verduras/Frutas" });
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Ocurrió un error al guardar el alimento: " + (err.message || err.toString()));
    }
  };

  const handleEditClick = (food: any) => {
    setEditingFoodId(food.id);
    setNewFood({
      name: food.name,
      quantity: food.quantity.toString(),
      unit: food.unit,
      category: food.category
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
          setScannerDraft(parsedFoods);
          setTicketTips(`¡Analizado con éxito! Extrajimos ${parsedFoods.length} alimentos de tu ticket.`);
          triggerAlert("success", "Ticket escaneado correctamente. Revisa la lista propuesta.");
        } else {
          const errData = await response.json();
          triggerAlert("error", errData.error || "Fallo al analizar el ticket digital.");
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
      setScannerDraft(sample.items);
      setTicketTips(`¡Carga instantánea! Se han extraído ${sample.items.length} alimentos.`);
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
        const existing = inventory.find(
          it => it.name.toLowerCase() === item.name.toLowerCase() && it.unit === item.unit
        );

        if (session?.user) {
          // --- MODO CLOUD (SUPABASE) ---
          if (existing) {
            const nextQty = existing.quantity + parseFloat(item.quantity);
            const { error } = await supabase
              .from("inventory")
              .update({ quantity: nextQty, last_updated: new Date().toISOString() })
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
                category: item.category,
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
                quantity: existing.quantity + parseFloat(item.quantity)
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
                category: item.category
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
    const list = inventory.filter(it => it.quantity > 0).map(it => it.name);
    setSelectedForRecipe(list);
  };

  const handleGenerateRecipeWithIA = async () => {
    if (selectedForRecipe.length === 0) {
      triggerAlert("error", "Selecciona al menos un ingrediente de tu despensa para componer el prompt.");
      return;
    }

    setGeneratingRecipe(true);
    setGeneratedRecipeDraft(null);

    try {
      // Filtrar alimentos completos que están seleccionados
      const itemsSelected = inventory
        .filter(it => selectedForRecipe.includes(it.name))
        .map(it => ({ name: it.name, quantity: it.quantity, unit: it.unit }));

      const res = await fetch("/api/gemini/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIngredients: itemsSelected,
          extraPrompt: chefExtraPrompt,
          allergies: profilePrefs.allergies,
          preferences: profilePrefs.preferences,
          cookingStyle: profilePrefs.cookingStyle
        })
      });

      if (res.ok) {
        const recipeResult = await res.json();
        setGeneratedRecipeDraft(recipeResult);
        triggerAlert("success", `Receta "${recipeResult.title}" redactada por Chef Gemini.`);
      } else {
        triggerAlert("error", "Error al formular la propuesta culinaria con Gemini.");
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
      if (res.ok) {
        const imported = await res.json();
        setGeneratedRecipeDraft(imported);
        setShowRecipeImporter(false);
        setImportingText("");
        triggerAlert("success", `Receta "${imported.title}" interpretada con éxito.`);
      } else {
        triggerAlert("error", "No se pudo digerir la receta. Intenta con un texto más conciso.");
      }
    } catch (err) {
      triggerAlert("error", "Conexión médica fallida.");
    } finally {
      setImportingState(false);
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
        // El servidor nos da una URL (puede ser un base64 o una imagen web)
        // Guardarla temporalmente/en el estado del componente
        setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, cover_url: data.imageUrl } : r));
        triggerAlert("success", `Cover personalizado generado para "${recipe.title}".`);
      }
    } catch (err) {
      triggerAlert("error", "No se pudo procesar la ilustración de la comida.");
    }
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la receta "${name}" de tu catálogo? Se borrará también de los planes semanal.`)) return;
    try {
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
      const match = inventory.find(
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

    try {
      if (session?.user) {
        // --- MODO CLOUD (SUPABASE) ---
        const { data, error } = await supabase
          .from("meal_plan")
          .insert({
            date: `2026-05-25`,
            plannerDay: selectedPlannerDay,
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
          triggerAlert("success", `"${recipes.find(r => r.id === selectedRecipeForPlan)?.title}" planificado para el ${selectedPlannerDay} en la ${selectedPlannerMeal} en la nube.`);
          setSelectedRecipeForPlan("");
        }
      } else {
        // --- MODO SANDBOX LOCAL FALLBACK (EXPRESS SERVER) ---
        const res = await fetch("/api/meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: `2026-05-25`,
            meal_type: selectedPlannerMeal,
            recipe_id: selectedRecipeForPlan,
            status: "planned"
          })
        });

        if (res.ok) {
          const savedItem = await res.json();
          const updatedWithDay = { ...savedItem, plannerDay: selectedPlannerDay };
          setMealPlan(prev => [...prev, updatedWithDay]);
          triggerAlert("success", `"${recipes.find(r => r.id === selectedRecipeForPlan)?.title}" planificado para el ${selectedPlannerDay} en la ${selectedPlannerMeal}.`);
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
        const match = inventory.find(
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
      const match = inventory.find(
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
              <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-900/30">
                <Carrot className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">Despensia</span>
            </div>
            <div className="flex items-center gap-4">
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
                  <span>Potenciado con Gemini 3.5 Flash</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                  Gestiona tu despensa. <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Cocina sin desperdiciar.
                  </span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Organiza tus ingredientes en casa, escanea recibos del supermercado con tu cámara, agenda menús semanales y genera deliciosas recetas personalizadas por Inteligencia Artificial con lo que tienes en stock.
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

                <div className="pt-4 flex justify-center lg:justify-start items-center gap-6 divide-x divide-slate-800">
                  <div>
                    <span className="block text-2xl font-extrabold text-white">100%</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cero Desperdicio</span>
                  </div>
                  <div className="pl-6">
                    <span className="block text-2xl font-extrabold text-white">Gemini</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Análisis Multimodal</span>
                  </div>
                  <div className="pl-6">
                    <span className="block text-2xl font-extrabold text-white">Cloud Sync</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Acceso Móvil Real</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Mockup Showcase */}
              <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
                <div className="relative z-10 space-y-4">
                  {/* Miniature Pantry Card */}
                  <div className="bg-slate-850/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:translate-x-2 transition-transform duration-300 backdrop-blur-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Poco Stock en Despensa</h4>
                        <p className="text-sm font-bold text-white mt-0.5">Tomates frescos: 2 uds</p>
                      </div>
                    </div>
                    <span className="bg-rose-950 text-rose-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-rose-900/60 font-mono">
                      ⚠️ Reponer
                    </span>
                  </div>

                  {/* Miniature Gemini suggestion Card */}
                  <div className="bg-slate-855/95 border border-emerald-500/40 p-6 rounded-3xl shadow-2xl space-y-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 backdrop-blur-xs">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-950 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-900/50 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Gemini Chef
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold font-mono">350 kcal</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white tracking-tight">Fajitas de Pollo Fit</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Sugerencia inteligente basada en tu stock (Pollo y Tomates).</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-750">Pechuga de Pollo</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-750">Tomates</span>
                    </div>
                    <button 
                      onClick={() => {
                        setGuestMode(true);
                        triggerAlert("info", "Iniciando preparación en modo Invitado.");
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" /> Cocinar en Vivo
                    </button>
                  </div>

                  {/* Miniature Weekly Planner card */}
                  <div className="bg-slate-850/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:-translate-x-2 transition-transform duration-300 backdrop-blur-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Plan Semanal</h4>
                        <p className="text-sm font-bold text-white mt-0.5">Comida agendada para el Miércoles</p>
                      </div>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md font-mono border border-slate-700/60">
                      Miércoles
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features details Section */}
        <section className="py-24 border-t border-slate-800/80 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Características Principales</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Todo lo que necesitas para tu cocina digital</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                Despensia combina análisis visual multimodal de tickets, sugerencias de chefs de inteligencia artificial y planificación de menús en una sola interfaz premium.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-6 hover:shadow-lg hover:border-slate-700/60 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Escáner de Tickets Multimodal</h3>
                <p className="text-xs sm:text-sm text-slate-450 leading-relaxed text-slate-450">
                  ¿Has vuelto de la compra? Hazle una foto al ticket. Nuestro motor Gemini extrae automáticamente los productos, cantidades y unidades, categorizando tu despensa sin esfuerzo manual.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-6 hover:shadow-lg hover:border-slate-700/60 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-amber-600/10 border border-amber-600/20 text-amber-400 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Chef IA Personalizado</h3>
                <p className="text-xs sm:text-sm text-slate-450 leading-relaxed text-slate-450">
                  No pienses más qué hacer de cenar. Selecciona qué ingredientes de tu despensa quieres consumir y Gemini diseñará una receta deliciosa detallando calorías, macros e instrucciones precisas.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-6 hover:shadow-lg hover:border-slate-700/60 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-teal-600/10 border border-teal-600/20 text-teal-400 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Planificador & Cocina Live</h3>
                <p className="text-xs sm:text-sm text-slate-450 leading-relaxed text-slate-450">
                  Planifica tu menú por adelantado. Al cocinar, sigue las instrucciones paso a paso con temporizadores inteligentes y deja que la aplicación descuente automáticamente las raciones reales de tu stock.
                </p>
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
              <Carrot className="w-4 h-4 text-emerald-500 animate-bounce" />
              <span className="font-sans font-black text-slate-300">Despensia</span>
            </div>
            <p>Despensia App 🍓 — AI Studio Build 2026. Todos los derechos reservados.</p>
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
      
      {/* HEADER DE LA APP */}
      <header id="main-header" className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-200">
              <Carrot className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Despensia</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> IA Powered
                </span>
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
                <span className="text-sm font-bold text-slate-700">{inventory.length} items</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                <span className="text-xs text-amber-500 block uppercase font-bold tracking-wider">Alertas</span>
                <span className="text-sm font-bold text-amber-600">
                  {inventory.filter(it => it.quantity <= 150 && it.unit === 'g' || it.quantity <= 1 && it.unit === 'uds').length} críticas
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
            <Carrot className="w-4 h-4" />
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
            
            {/* ALERTAS CRÍTICAS DE STOCK BAJO */}
            {inventory.some(it => it.quantity <= 150 && it.unit === 'g' || it.quantity <= 1 && it.unit === 'uds') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Alimentos a punto de agotarse o vacíos de stock</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Te sugerimos reponer inteligentemente estos productos antes de que planifiques tu próxima receta:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inventory
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
                    setNewFood({ name: "", quantity: "", unit: "g", category: "Verduras/Frutas" });
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

                <form onSubmit={handleAddFood} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Alimento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Arroz Integral"
                      value={newFood.name}
                      onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
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
                      onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4 flex justify-end gap-3 mt-2">
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
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">Alimentos Registrados en Tu Casa</h3>
                  <p className="text-xs text-slate-400">Total en despensa: {inventory.length} alimentos listos para cocinar</p>
                </div>
                <button 
                  onClick={() => selectAllWithStock()} 
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Seleccionar todos en stock para receta
                </button>
              </div>

              {inventory.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Carrot className="w-12 h-12 text-slate-300 mx-auto" />
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
                        <th className="py-3.5 px-6 text-center">Disponible</th>
                        <th className="py-3.5 px-6 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 text-sm">
                      {inventory
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
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">Ingrediente(s) asignados para recetar ({selectedForRecipe.length})</span>
                  {selectedForRecipe.length === 0 ? (
                    <p className="text-xs text-emerald-200">⚠️ Ningún ingrediente seleccionado. Ve a la pestaña Despensa y marca las casillas de verificación correspondientes o selecciona todos.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedForRecipe.map(name => (
                        <span key={name} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center gap-1 font-semibold transition-colors">
                          {name}
                          <button onClick={() => toggleSelectForRecipe(name)} className="text-emerald-300 hover:text-white">×</button>
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

                {/* Acción de procesar */}
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    id="submit-ai-recipe"
                    disabled={generatingRecipe}
                    onClick={handleGenerateRecipeWithIA}
                    className="bg-white text-emerald-800 disabled:bg-emerald-200 font-bold px-6 py-3 rounded-xl text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    {generatingRecipe ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                        Amasando ingredientes y redactando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Formular Receta IA 🪄
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

            {/* PROPUESTA GENERADA PENDIENTE DE REVISIÓN */}
            {generatedRecipeDraft && (
              <div className="bg-amber-50/50 rounded-2xl border-2 border-amber-300 p-6 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider">Revisión Culinaria IA</span>
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

                <div className="flex justify-end gap-3 border-t border-amber-200 pt-4">
                  <button
                    onClick={() => setGeneratedRecipeDraft(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Descartar receta borrador
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

                          {/* Botón de Lanzamiento de Modo Cocinar Live */}
                          <button
                            onClick={() => startLiveCookingMode(recipe)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" /> Iniciar Cocina Live 👨‍🍳
                          </button>
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
          <div id="live-cooking-overlay" className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden animate-scale-up border border-slate-200">
              
              {/* Header de la cocina (común) */}
              <div className="bg-emerald-600 text-white p-6 relative">
                {livePlannedItem ? (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 shadow-2xs">
                    📅 PLANIFICADO PARA EL {livePlannedItem.plannerDay?.toUpperCase()} — {livePlannedItem.meal_type?.toUpperCase()}
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    Asistente en Vivo Despensia
                  </span>
                )}
                <h3 className="text-2xl font-black mt-2 tracking-tight">{liveRecipe.title}</h3>
                <p className="text-xs text-emerald-100 mt-1">Sigue el procedimiento guiado paso a paso y ajusta el consumo de stock de tu despensa.</p>
                <button 
                  onClick={() => {
                    if (confirm("¿Seguro que deseas salir del asistente de cocina live? Tu progreso se perderá.")) {
                      setLiveRecipe(null);
                      setLivePlannedItem(null);
                    }
                  }}
                  className="absolute top-6 right-6 text-emerald-100 hover:text-white text-xs font-bold bg-emerald-700/80 hover:bg-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-500 transition-colors"
                >
                  Salir Modo Cocina
                </button>
              </div>

              {/* Contenedor en cuadrícula de dos columnas en pantallas medianas */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* COLUMNA IZQUIERDA: PASOS DE PREPARACIÓN (7 de 12 columnas) */}
                <div className="md:col-span-7 p-6 space-y-6">
                  
                  {/* Visualizador de progreso en pasos */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tu progreso general:</p>
                    <div className="flex gap-1">
                      {completedSteps.map((chk, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            if (i < completedSteps.length) {
                              setLiveCurrentStep(i);
                              parseStepTimer(liveRecipe.instructions.split(/\n+/).filter((s: string) => s.trim().length > 0)[i] || "");
                            }
                          }}
                          className={`h-2.5 flex-grow first:rounded-l-full last:rounded-r-full transition-all duration-300 cursor-pointer ${
                            chk ? "bg-emerald-500 hover:bg-emerald-600" : i === liveCurrentStep ? "bg-amber-400 shadow-xs" : "bg-slate-200 hover:bg-slate-300"
                          }`}
                          title={`Ver Paso ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Detalle visual del Paso Activo */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 relative">
                    <span className="bg-amber-100 text-amber-800 font-extrabold block text-[10px] font-mono tracking-widest w-fit rounded py-0.5 px-2 mb-3 uppercase shadow-3xs">
                      Paso {liveCurrentStep + 1} de {completedSteps.length}
                    </span>
                    
                    {/* Cuerpo del paso */}
                    <div className="text-base font-medium text-slate-800 whitespace-pre-line leading-relaxed min-h-[140px]">
                      {liveRecipe.instructions
                        .split(/\n+/)
                        .filter((s: string) => s.trim().length > 0)[liveCurrentStep]}
                    </div>

                    {/* Acciones del paso */}
                    <div className="mt-6 pt-4 border-t border-slate-200/60 flex justify-between items-center flex-wrap gap-2">
                      <button
                        onClick={() => handleStepCheckbox(liveCurrentStep)}
                        className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-3xs ${
                          completedSteps[liveCurrentStep]
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {completedSteps[liveCurrentStep] ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ¡Completado!
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 text-slate-300" /> Marcar como hecho
                          </>
                        )}
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigateLiveStep(-1)}
                          disabled={liveCurrentStep === 0}
                          className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => navigateLiveStep(1)}
                          disabled={liveCurrentStep === completedSteps.length - 1}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Temporizador inteligente integrado */}
                  {cookingTimeLeft !== null && (
                    <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 rounded-lg text-white shadow-sm animate-pulse">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cronómetro estimado para el paso</p>
                          <h4 className="font-extrabold text-2xl text-slate-800 tracking-tight mt-1 font-mono">
                            {formatTimerValue(cookingTimeLeft)}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCookingTimerActive(!cookingTimerActive)}
                          className={`font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-xs transition-all ${
                            cookingTimerActive ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {cookingTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {cookingTimerActive ? "Pausar" : "Iniciar"}
                        </button>
                        <button
                          onClick={() => {
                            setCookingTimeLeft(cookingTimerOriginalValue);
                            setCookingTimerActive(false);
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs p-2.5 rounded-lg transition-colors"
                          title="Reiniciar temporizador"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* COLUMNA DERECHA: SEGUIMIENTO DE MATERIALES Y CONSUMOS (5 de 12 columnas) */}
                <div className="md:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between">
                  
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-2.5">
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Utensils className="w-4 h-4 text-emerald-600 animate-spin" />
                        Consumo real de Despensa
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Revisa la cantidad que gastas de tu stock para que se actualice tu Despensa de forma exacta:
                      </p>
                    </div>

                    {/* Listado de ingredientes dinámicos con controles táctiles */}
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {liveIngredientsToConsume.map((ing, idx) => {
                        const isMatched = !!ing.inventoryMatchId;
                        const isNoStock = isMatched && ing.inventoryMatchCurrentQty <= 0;
                        const isExceeded = isMatched && ing.qtyToConsume > ing.inventoryMatchCurrentQty;
                        
                        // Escala del botón según sea gramos u otra unidad
                        const stepValue = ing.unit?.toLowerCase() === "g" || ing.unit?.toLowerCase() === "ml" ? 50 : 1;

                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-xl border transition-all ${
                              isExceeded 
                                ? "bg-rose-50/70 border-rose-200" 
                                : isMatched 
                                ? "bg-white border-slate-200" 
                                : "bg-slate-100/60 border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div>
                                <p className="text-xs font-bold text-slate-800 leading-tight">{ing.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Recetado para el plato: <span className="font-semibold text-slate-600">{ing.qtyRequired}</span></p>
                              </div>

                              {isMatched ? (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${
                                  isNoStock 
                                    ? "bg-rose-100 text-rose-800 border-rose-200" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                }`}>
                                  <Check className="w-2.5 h-2.5 stroke-[3px]" /> Stock: {ing.inventoryMatchCurrentQty} {ing.unit}
                                </span>
                              ) : (
                                <span className="bg-slate-200 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-slate-350">
                                  No en despensa
                                </span>
                              )}
                            </div>

                            {/* Controles para cambiar la cantidad consumida */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/70">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Porción gastada:</span>
                              
                              <div className="flex items-center gap-1.5">
                                {/* Botón decrementar */}
                                <button
                                  type="button"
                                  onClick={() => adjustLiveQtyToConsume(idx, -stepValue)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors shadow-3xs"
                                  title={`Restar ${stepValue} ${ing.unit}`}
                                >
                                  -
                                </button>

                                <div className="flex items-center border border-slate-250 rounded bg-white overflow-hidden shadow-3xs focus-within:ring-1 focus-within:ring-emerald-500">
                                  <input
                                    type="number"
                                    value={ing.qtyToConsume}
                                    onChange={(e) => handleLiveQtyInputChange(idx, e.target.value)}
                                    className="w-14 h-7 text-xs font-black text-center text-slate-800 focus:outline-none focus:ring-0 select-all"
                                  />
                                  <span className="bg-slate-50/50 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-500 uppercase border-l border-slate-100">
                                    {ing.unit}
                                  </span>
                                </div>

                                {/* Botón incrementar */}
                                <button
                                  type="button"
                                  onClick={() => adjustLiveQtyToConsume(idx, stepValue)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors shadow-3xs"
                                  title={`Sumar ${stepValue} ${ing.unit}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Alerta de exceso sobre el stock real */}
                            {isExceeded && (
                              <p className="text-[9px] text-rose-600 font-bold mt-1.5 flex items-center gap-0.5 animate-pulse">
                                ⚠ Excede los {ing.inventoryMatchCurrentQty}{ing.unit} de tu stock. Dejará la despensa a 0.
                              </p>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estado indicativo del descuento */}
                  <div className="bg-slate-100/90 border border-slate-200 p-3 rounded-xl mt-4 text-[10px] text-slate-500 leading-snug">
                    💡 <span className="font-bold text-slate-650">¿Sabías que?</span> Al guardar la receta, Despensia descontará automáticamente estas raciones individuales ajustadas de tu base de datos y marcará la fecha de hoy.
                  </div>

                </div>

              </div>

              {/* Pie de modal de cocina (común para finalización y control de estado) */}
              <div className="bg-slate-100 px-6 py-4.5 flex justify-between items-center border-t border-slate-200 flex-wrap gap-3">
                <span className="text-xs text-slate-500 font-black font-mono">
                  Pasos hechos: {completedSteps.filter(Boolean).length} / {completedSteps.length}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que deseas cancelar la preparación de este plato?")) {
                        setLiveRecipe(null);
                        setLivePlannedItem(null);
                        triggerAlert("info", "Preparación en vivo cancelada.");
                      }
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold px-3 py-2"
                  >
                    Cancelar plato
                  </button>

                  {completedSteps.every(Boolean) ? (
                    <button
                      onClick={handleFinishCooking}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-200 animate-bounce cursor-pointer flex items-center gap-1.5"
                    >
                      🎉 ¡Completar y servir plato!
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm("¿Deseas dar por finalizada la preparación y descontar ingredientes aunque te falten pasos por marcar?")) {
                          handleFinishCooking();
                        }
                      }}
                      disabled={loading}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-xs"
                    >
                      Terminar y Servir 🍳
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}


        {/* ==================================================================== */}
        {/* PESTAÑA: PLANIFICADOR DE MENÚS (WEEKLY PLANNER WITH DIRECT EFFECT REGULATORY) */}
        {/* ==================================================================== */}
        {activeTab === "planner" && (
          <div id="panel-planner" className="space-y-8 animate-fade-in">
            
            {/* AGENDAR MENÚ INTUICIÓN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Programar Menús Semanales
                </h3>
                <p className="text-xs text-slate-400">Escoge un día de la semana, el tipo de plato y vincula una de tus recetas para balancear tus calorías y automatizar la cocina.</p>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-rose-50 text-rose-800 py-3.5 px-4 rounded-xl text-xs border border-rose-100 font-semibold">
                  ⚠️ Necesitas registrar al menos una receta en tu catálogo antes de poder programar el planificador semanal.
                </div>
              ) : (
                <form onSubmit={handleAddToPlan} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Día de la semana</label>
                    <select
                      value={selectedPlannerDay}
                      onChange={(e) => setSelectedPlannerDay(e.target.value)}
                      className="w-full bg-slate-50/70 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500 cursor-pointer"
                    >
                      {STANDARD_DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
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
              {STANDARD_DAYS.map(day => {
                const dayMeals = getDayMeals(day);
                
                return (
                  <div key={day} className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden flex flex-col h-full min-h-[300px]">
                    
                    {/* Header Día */}
                    <div className="bg-slate-100/70 px-4 py-2 text-center border-b border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-700 block text-center flex-1">{day}</span>
                      {dayMeals.length > 0 && (
                        <span className="bg-slate-200 text-slate-600 rounded-full w-4.5 h-4.5 text-[9px] font-bold flex items-center justify-center font-mono">
                          {dayMeals.length}
                        </span>
                      )}
                    </div>

                    {/* Menús listados del día */}
                    <div className="p-3 flex-1 space-y-3 divide-y divide-slate-100/50">
                      {dayMeals.length === 0 ? (
                        <p className="text-[10px] text-slate-400 py-12 text-center italic">Vacío</p>
                      ) : (
                        dayMeals.map((planned, index) => {
                          const recipe = recipes.find(r => r.id === planned.recipe_id);
                          const isConsumed = planned.status === "consumed";

                          return (
                            <div key={planned.id} className="pt-2 text-left space-y-1.5 first:pt-0">
                              
                              <div className="flex items-center justify-between">
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                                  {planned.meal_type}
                                </span>
                                
                                <button
                                  onClick={() => handleRemoveFromPlan(planned.id)}
                                  className="text-rose-400 hover:text-rose-600 p-0.5 rounded"
                                  title="Quitar de planificación"
                                >
                                  ×
                                </button>
                              </div>

                              <h5 className="text-xs font-extrabold text-slate-800 leading-snug">{recipe?.title || "Receta no disponible"}</h5>
                              
                              {recipe && (
                                <div className="space-y-1">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{recipe.macros_summary}</p>
                                  
                                  {isConsumed ? (
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center justify-center gap-1 border border-slate-100">
                                      ✓ Consumido
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => startLiveCookingMode(recipe, planned)}
                                      disabled={loading}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1.5 rounded-lg border border-emerald-500 shadow-3xs flex items-center justify-center gap-1 active:scale-95 transition-all text-center uppercase tracking-wider block cursor-pointer"
                                      title="Iniciar preparación guiada y controlar merma de stock en vivo"
                                    >
                                      🍳 Cocinar en Vivo
                                    </button>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 font-medium font-mono">
          Despensia App 🍓 — AI Studio Build 2026. Todos los derechos reservados.
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
