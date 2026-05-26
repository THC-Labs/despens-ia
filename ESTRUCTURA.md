# Estructura de Carpetas Recomendada para Next.js 14+ (App Router)

Para organizar **Despensia** dentro de tu proyecto Next.js utilizando el directorio `src/`, te recomendamos seguir esta estructura modular basada en características y responsabilidades:

```bash
src/
├── app/                      # Rutas de Next.js (App Router)
│   ├── layout.tsx            # Layout general con el proveedor de Supabase, estilos y Navbar común
│   ├── page.tsx              # Página principal de bienvenida o dashboard integrado resumido
│   ├── inventario/           # Módulo de Inventario de Alimentos
│   │   ├── page.tsx          # Vista principal del inventario (Lista, filtros de categorías, búsqueda)
│   │   └── loading.tsx       # Estado de carga personalizado
│   ├── recetas/              # Módulo de Recetas generadas por IA y guardadas
│   │   ├── page.tsx          # Colección de recetas guardadas
│   │   ├── [id]/             # Detalle interactivo de una receta en particular
│   │   │   └── page.tsx      
│   │   └── generar/          # Generador interactivo de recetas autónomas con Gemini AI
│   │       └── page.tsx      
│   └── planificador/         # Módulo de Planificación Semanal "en vivo"
│       └── page.tsx          # Calendario interactivo con asignación de comidas (Comida/Cena/Snack)
│
├── components/               # Componentes reutilizables agrupados por contexto
│   ├── ui/                   # Componentes atómicos base (Buttons, Input, Card, Dialogs, etc.)
│   ├── inventario/           # Formularios de añadir/editar alimento, alertas de bajo stock
│   ├── recetas/              # Tarjetas de receta, visor de macros, generador IA loader
│   └── planificador/         # Grid de calendario semanal, selector de recetas para el día
│
├── lib/                      # Clientes de servicios externos y utilidades puras
│   ├── supabase.ts           # Inicialización del cliente de Supabase (Database general)
│   ├── gemini.ts             # Cliente de integración con la API de IA (Service-side helpers)
│   └── utils.ts              # Utilidades como formateadores, uniones de Tailwind ClassNames (cn)
│
├── types/                    # Definiciones de Tipos estáticos de TypeScript
│   ├── database.ts           # Los tipos sincronizados de Supabase creados anteriormente
│   └── index.ts              # Tipos generales de UI, estados de aplicación o filtros
│
└── styles/                   # Configuración del motor de estilos global (si aplica)
    └── globals.css           # Carga de plugins y capas de Tailwind CSS
```

### Explicación detallada de los Módulos Clave:

1. **`src/app/`**: 
   - Next.js asocia automáticamente cada subdirectorio con una ruta web (routing por carpetas).
   - El uso de archivos reservados como `page.tsx`, `layout.tsx`, `loading.tsx` y `error.tsx` permite controlar el ciclo de vida de la página con excelentes prestaciones UX.

2. **`src/components/`**:
   - Mantiene tu directorio de rutas limpio. En lugar de codificar tablas pesadas o modales en `app/inventario/page.tsx`, extrae elementos interactivos como `<InventoryTable />` o `<AddIngredientModal />` aquí.

3. **`src/lib/`**:
   - Centraliza el acceso a la base de datos de Supabase y servicios de modelos de lenguaje, previniendo múltiples conexiones duplicadas no deseadas.
