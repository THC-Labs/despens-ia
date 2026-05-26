import React, { useState } from "react";
import { Plus, Minus, Trash2, Search, Filter, AlertTriangle, ArrowUpDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types/database";

const CATEGORIES = [
  "Todos",
  "Verduras/Frutas",
  "Carnes",
  "Pescados/Mariscos",
  "Lácteos/Huevos",
  "Granos",
  "Condimentos",
  "Otros"
];

const ADD_CATEGORIES = [
  "Verduras/Frutas",
  "Carnes",
  "Pescados/Mariscos",
  "Lácteos/Huevos",
  "Granos",
  "Condimentos",
  "Otros"
];

interface InventoryTabProps {
  inventory: InventoryItem[];
  onAddItem: (name: string, quantity: number, unit: string, category: string) => Promise<void>;
  onUpdateQty: (id: string, quantity: number) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function InventoryTab({ inventory, onAddItem, onUpdateQty, onDeleteItem }: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"name" | "quantity" | "last_updated">("name");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Inputs
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("uds");
  const [category, setCategory] = useState("Verduras/Frutas");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("El nombre del alimento es requerido.");
      return;
    }
    if (quantity < 0) {
      setErrorMsg("La cantidad no puede ser negativa.");
      return;
    }

    try {
      await onAddItem(name, quantity, unit, category);
      setName("");
      setQuantity(1);
      setUnit("uds");
      setCategory("Verduras/Frutas");
      setErrorMsg("");
      setIsFormOpen(false);
    } catch (err) {
      setErrorMsg("Error al guardar el alimento.");
    }
  };

  // Filtrado y ordenación
  const filteredItems = inventory
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      if (sortOrder === "quantity") return b.quantity - a.quantity;
      return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            🥦 Mi Despensa de Alimentos
          </h2>
          <p className="text-slate-500 text-sm">Gestiona tus existencias de comida y reabastece de forma práctica.</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {isFormOpen ? "Cerrar Formulario" : "Añadir Nuevo Alimento"}
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Formulario desplegable */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100 p-5 p-y-4"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del alimento</label>
                <input
                  type="text"
                  placeholder="Ej. Pechuga de Pollo, Tomate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="E.g. 500"
                    value={quantity === 0 ? "" : quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-2/3 text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-1/3 text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="uds">uds</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="pizcas">pizcas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ADD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 px-4 text-sm font-semibold shadow-sm transition-all"
                >
                  Guardar Alimento
                </button>
              </div>

              {errorMsg && <p className="text-red-500 text-xs md:col-span-4 mt-1 font-medium">{errorMsg}</p>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 text-slate-800 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Categorías filtro */}
        <div className="flex flex-wrap gap-1 w-full sm:w-auto overflow-x-auto sm:justify-end pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Orden */}
        <div className="flex items-center gap-2 border-l border-slate-100 pl-4 h-8 self-stretch justify-end">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Ordenar por:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="name">Alfabético</option>
            <option value="quantity">Cantidad</option>
            <option value="last_updated">Último cambio</option>
          </select>
        </div>
      </div>

      {/* Listado de Inventario */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-10 text-center border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">No se encontraron alimentos en la despensa.</p>
          <p className="text-slate-400 text-xs mt-1">Añade nuevos ingredientes para empezar a planear tus recetas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isLowStock = item.quantity <= (item.unit === "g" ? 150 : item.unit === "ml" ? 200 : 2);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${
                  isLowStock ? "border-amber-100 bg-amber-50/5" : "border-slate-100"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mb-2">
                        {item.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-800">{item.name}</h4>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="Eliminar de la despensa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cantidad grande y controlador inline */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">
                        {item.quantity}{" "}
                        <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Actualizado: {new Date(item.last_updated).toLocaleDateString("es-ES")}
                      </p>
                    </div>

                    {/* Controlador rápido */}
                    <div className="flex items-center gap-1 border border-slate-100 rounded-lg p-1 bg-slate-50/50">
                      <button
                        onClick={() => onUpdateQty(item.id, Math.max(0, item.quantity - (item.unit === "g" ? 100 : item.unit === "ml" ? 100 : 1)))}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-100 transition shadow-sm cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onUpdateQty(item.id, item.quantity + (item.unit === "g" ? 100 : item.unit === "ml" ? 100 : 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-100 transition shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isLowStock && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                    Bajo Stock: Considera reponer pronto.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
