// Definición de tipos de TypeScript para Supabase / Despensia

export interface InventoryItem {
  id: string; // uuid
  name: string;
  quantity: number;
  unit: string; // uds, gr, kg, ml, etc.
  category: string; // Verduras, Carnes, Lácteos, Granos, etc.
  last_updated: string; // timestamp ISO string
}

export interface RequiredIngredient {
  name: string;
  quantity: number | string;
  unit: string;
}

export interface Recipe {
  id: string; // uuid
  title: string;
  ingredients_required: RequiredIngredient[]; // jsonb
  instructions: string;
  macros_summary: string | null; // e.g., "450 kcal | P: 25g | C: 50g | F: 12g"
  created_at: string; // timestamp ISO string
}

export interface MealPlanItem {
  id: string; // uuid
  date: string; // format YYYY-MM-DD
  meal_type: 'Comida' | 'Cena' | 'Snack' | 'Desayuno';
  recipe_id: string; // references recipes.id
  status: 'planned' | 'consumed';
}

// Representación completa del esquema para Supabase Database types helper
export interface Database {
  public: {
    Tables: {
      inventory: {
        Row: InventoryItem;
        Insert: Omit<InventoryItem, 'id' | 'last_updated'> & {
          id?: string;
          last_updated?: string;
        };
        Update: Partial<InventoryItem>;
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Recipe>;
      };
      meal_plan: {
        Row: MealPlanItem;
        Insert: Omit<MealPlanItem, 'id' | 'status'> & {
          id?: string;
          status?: 'planned' | 'consumed';
        };
        Update: Partial<MealPlanItem>;
      };
    };
  };
}
