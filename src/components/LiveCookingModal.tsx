import React from "react";
import { Check, CheckCircle2, CheckSquare, Pause, Play, RotateCcw, Timer, Utensils } from "lucide-react";

interface LiveCookingModalProps {
  liveRecipe: any;
  setLiveRecipe: (r: any) => void;
  livePlannedItem: any;
  setLivePlannedItem: (i: any) => void;
  completedSteps: boolean[];
  setCompletedSteps: (steps: boolean[]) => void;
  liveCurrentStep: number;
  setLiveCurrentStep: (step: number) => void;
  cookingTimeLeft: number | null;
  setCookingTimeLeft: (time: number | null) => void;
  cookingTimerActive: boolean;
  setCookingTimerActive: (active: boolean) => void;
  cookingTimerOriginalValue: number;
  liveIngredientsToConsume: any[];
  handleFinishCooking: () => Promise<void>;
  loading: boolean;
  triggerAlert: (type: "success" | "error" | "info" | "warning", msg: string) => void;
  parseStepTimer: (stepText: string) => void;
  formatTimerValue: (totalSeconds: number) => string;
  adjustLiveQtyToConsume: (index: number, diff: number) => void;
  handleLiveQtyInputChange: (index: number, valStr: string) => void;
  navigateLiveStep: (direction: number) => void;
  handleStepCheckbox: (index: number) => void;
}

export default function LiveCookingModal({
  liveRecipe,
  setLiveRecipe,
  livePlannedItem,
  setLivePlannedItem,
  completedSteps,
  liveCurrentStep,
  setLiveCurrentStep,
  cookingTimeLeft,
  setCookingTimeLeft,
  cookingTimerActive,
  setCookingTimerActive,
  cookingTimerOriginalValue,
  liveIngredientsToConsume,
  handleFinishCooking,
  loading,
  triggerAlert,
  parseStepTimer,
  formatTimerValue,
  adjustLiveQtyToConsume,
  handleLiveQtyInputChange,
  navigateLiveStep,
  handleStepCheckbox
}: LiveCookingModalProps) {
  return (
    <div id="live-cooking-overlay" className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden animate-scale-up border border-slate-200 text-left">
        
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
            className="absolute top-6 right-6 text-emerald-100 hover:text-white text-xs font-bold bg-emerald-700/80 hover:bg-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-500 transition-colors cursor-pointer"
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
                  className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-3xs cursor-pointer ${
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
                    className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => navigateLiveStep(1)}
                    disabled={liveCurrentStep === completedSteps.length - 1}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm cursor-pointer"
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
                    className={`font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
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
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs p-2.5 rounded-lg transition-colors cursor-pointer"
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
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors shadow-3xs cursor-pointer"
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
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors shadow-3xs cursor-pointer"
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
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-3 py-2 cursor-pointer"
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
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Terminar y Servir 🍳
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
