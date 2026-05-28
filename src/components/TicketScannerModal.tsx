import React from "react";
import { Camera, Upload, RefreshCw, Sparkles, ChevronRight, Trash2, Check } from "lucide-react";

interface TicketScannerModalProps {
  showScanner: boolean;
  setShowScanner: (s: boolean) => void;
  scanning: boolean;
  ticketTips: string;
  scannerDraft: any[];
  handleUploadTicketImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  useSampleTicket: (sample: any) => void;
  handleUpdateDraftItem: (index: number, key: string, value: any) => void;
  handleRemoveDraftItem: (index: number) => void;
  setScannerDraft: (d: any[]) => void;
  handleImportScannerDraft: () => Promise<void>;
  SAMPLE_TICKET_MERCADONA: any;
  SAMPLE_TICKET_CARREFOUR: any;
  CATEGORIES: string[];
}

export default function TicketScannerModal({
  showScanner,
  setShowScanner,
  scanning,
  ticketTips,
  scannerDraft,
  handleUploadTicketImage,
  useSampleTicket,
  handleUpdateDraftItem,
  handleRemoveDraftItem,
  setScannerDraft,
  handleImportScannerDraft,
  SAMPLE_TICKET_MERCADONA,
  SAMPLE_TICKET_CARREFOUR,
  CATEGORIES
}: TicketScannerModalProps) {
  if (!showScanner) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-md space-y-6 animate-fade-in relative">
      <button 
        onClick={() => setShowScanner(false)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
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
              className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-700">Ticket de Compra Mercadona</p>
                <p className="text-[10px] text-slate-400">Pollo, Tomate, Huevos, Arroz Integral</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => useSampleTicket(SAMPLE_TICKET_CARREFOUR)}
              className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
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
        <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 space-y-4 animate-fade-in text-left">
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
                  className="p-1 text-rose-450 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setScannerDraft([])}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
            >
              Descartar todo
            </button>
            <button
              onClick={handleImportScannerDraft}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Confirmar e importar a Despensa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
