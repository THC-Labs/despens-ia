import React from "react";
import { Calendar, Plus } from "lucide-react";
import { MacroGoals, Macros } from "../types/database";

interface MealPlannerTabProps {
  recipes: any[];
  mealPlan: any[];
  weekDates: Date[];
  weekMacrosTotals: Record<string, Macros>;
  macroGoals: MacroGoals;
  setMacroGoals: React.Dispatch<React.SetStateAction<MacroGoals>>;
  currentWeekDate: Date;
  setCurrentWeekDate: (d: Date) => void;
  showGoalsEditor: boolean;
  setShowGoalsEditor: (s: boolean) => void;
  selectedPlannerDate: string;
  setSelectedPlannerDate: (s: string) => void;
  selectedPlannerMeal: string;
  setSelectedPlannerMeal: (s: string) => void;
  selectedRecipeForPlan: string;
  setSelectedRecipeForPlan: (s: string) => void;
  handleAddToPlan: (e: React.FormEvent) => Promise<void>;
  handleRemoveFromPlan: (plannedId: string) => Promise<void>;
  startLiveCookingMode: (recipe: any, planned: any) => void;
  loading: boolean;
  triggerAlert: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  formatDateLabel: (date: Date) => string;
  formatLocalDate: (date: Date) => string;
  getWeekDayNameEs: (date: Date) => string;
  MEAL_TYPES: string[];
}

export default function MealPlannerTab({
  recipes,
  mealPlan,
  weekDates,
  weekMacrosTotals,
  macroGoals,
  setMacroGoals,
  currentWeekDate,
  setCurrentWeekDate,
  showGoalsEditor,
  setShowGoalsEditor,
  selectedPlannerDate,
  setSelectedPlannerDate,
  selectedPlannerMeal,
  setSelectedPlannerMeal,
  selectedRecipeForPlan,
  setSelectedRecipeForPlan,
  handleAddToPlan,
  handleRemoveFromPlan,
  startLiveCookingMode,
  loading,
  triggerAlert,
  formatDateLabel,
  formatLocalDate,
  getWeekDayNameEs,
  MEAL_TYPES
}: MealPlannerTabProps) {
  return (
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
  );
}
