-- ====================================================================
-- DESPENSIA - Inicialización y Migración Completa de Base de Datos para Supabase
-- Estructura multiusuario optimizada con Seguridad de Nivel de Fila (RLS)
-- ====================================================================

-- Habilitar la extensión para generar UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: INVENTARIO (inventory)
-- Almacena los ingredientes vinculados a la cuenta de cada usuario
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'uds', -- (g, ml, uds, kg, etc.)
    category TEXT NOT NULL DEFAULT 'Otros', -- (Verduras/Frutas, Carnes, etc.)
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABLA: RECETAS (recipes)
-- Almacena recetas creadas u obtenidas mediante IA por cada usuario de forma aislada
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    ingredients_required JSONB NOT NULL DEFAULT '[]'::jsonb, -- Estructura: [{"name": "Arroz", "quantity": 100, "unit": "g"}]
    instructions TEXT NOT NULL,
    macros_summary TEXT, -- Resumen calórico (ej: "450 kcal | P: 25g")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA: PLANIFICADOR DE MENÚS (meal_plan)
-- Almacena la planificación semanal de comidas por usuario
CREATE TABLE IF NOT EXISTS public.meal_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    date DATE NOT NULL,
    plannerDay TEXT NOT NULL DEFAULT 'Lunes', -- Se alinea con el estado local "Lunes", "Martes", etc.
    meal_type TEXT NOT NULL CHECK (meal_type IN ('Desayuno', 'Comida', 'Cena', 'Snack')),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'consumed')),
    CONSTRAINT unique_user_meal_date_slot UNIQUE (user_id, date, meal_type, recipe_id)
);

-- --------------------------------------------------------------------
-- DELEGACIÓN DE ÍNDICES DE RENDIMIENTO (BÚSQUEDAS RÁPIDAS MULTIUSUARIO)
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_date ON public.meal_plan(user_id, date);

-- --------------------------------------------------------------------
-- CONFIGURACIÓN DE SEGURIDAD DE NIVEL DE FILA (RLS) MULTIUSUARIO
-- --------------------------------------------------------------------
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA LA TABLA: INVENTARIO (inventory)
CREATE POLICY "Permitir lectura de inventario propio" 
    ON public.inventory FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de inventario propio" 
    ON public.inventory FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de inventario propio" 
    ON public.inventory FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir borrado de inventario propio" 
    ON public.inventory FOR DELETE 
    USING (auth.uid() = user_id);


-- POLÍTICAS PARA LA TABLA: RECETAS (recipes)
CREATE POLICY "Permitir lectura de recetas propias" 
    ON public.recipes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de recetas propias" 
    ON public.recipes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de recetas propias" 
    ON public.recipes FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir borrado de recetas propias" 
    ON public.recipes FOR DELETE 
    USING (auth.uid() = user_id);


-- POLÍTICAS PARA LA TABLA: PLANIFICADOR (meal_plan)
CREATE POLICY "Permitir lectura de planificaciones propias" 
    ON public.meal_plan FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de planificaciones propias" 
    ON public.meal_plan FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de planificaciones propias" 
    ON public.meal_plan FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir borrado de planificaciones propias" 
    ON public.meal_plan FOR DELETE 
    USING (auth.uid() = user_id);
