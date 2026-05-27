# 🚀 Guía de Troubleshooting: Conexión Gemini API en Railway

## 📋 Problema
La aplicación no conecta con la API de Gemini a través de Railway y Cloudflare.

## ✅ Checklist de Soluciones

### 1. **Verificar Variables de Entorno en Railway**

En tu dashboard de Railway (`railway.app`):
1. Accede a tu proyecto
2. Ve a **Settings** → **Variables**
3. Confirma que existe:
   - `GEMINI_API_KEY=sk-...` (tu clave real)
   - `NODE_ENV=production`
   - `PORT=3000` (opcional, por defecto 3000)

```bash
# Verificar localmente que se cargan correctamente:
echo $GEMINI_API_KEY
```

### 2. **Configurar Cloudflare (si aplica)**

Si Cloudflare está en medio como proxy:

#### A. Allowlist de API de Google
1. Cloudflare Dashboard → **Security** → **Firewall Rules**
2. Crear una regla:
   ```
   (cf.threat_score < 50) and (http.host contains "googleapis.com")
   Action: Allow
   ```

#### B. Desactivar optimizaciones conflictivas
- **Speed** → **Optimization**: Desactivar "Brotli" para respuestas JSON
- **Security** → **HTTP Strict Transport Security (HSTS)**: Verificar compatibilidad
- **Caching**: Marcar como "Bypass Cache" para `/api/gemini/*`

#### C. Headers personalizados (si es necesario)
```
Page Rule: 
URL Pattern: api.generativeai.google.com/*
Setting: Cache Level = Bypass
```

### 3. **Logs en Railway (Diagnóstico)**

```bash
# Ver logs en tiempo real
railway logs -f

# Buscar errores de Gemini
railway logs | grep "ERROR\|Gemini\|API"
```

Deberías ver líneas como:
```
🔍 DEBUG: GEMINI_API_KEY existe: true
🔍 DEBUG: Modelo utilizado: gemini-2.5-flash
✅ Respuesta de Gemini recibida correctamente
```

### 4. **Prueba Manual de Conexión**

```bash
# Test la API localmente
curl -X POST http://localhost:3000/api/gemini/recipe \
  -H "Content-Type: application/json" \
  -d '{
    "selectedIngredients": [
      {"name": "Pollo", "quantity": 500, "unit": "g"}
    ],
    "allergies": [],
    "preferences": [],
    "cookingStyle": "Saludable",
    "forceRegenerate": false
  }'

# Test en producción
curl -X POST https://tu-app.railway.app/api/gemini/recipe \
  -H "Content-Type: application/json" \
  -d '{"selectedIngredients":[{"name":"Pollo","quantity":500,"unit":"g"}],"allergies":[],"preferences":[],"cookingStyle":"Saludable","forceRegenerate":false}'
```

### 5. **Validar Clave de API de Gemini**

1. Accede a [Google AI Studio](https://ai.google.dev/aistudio)
2. Verifica que tu clave:
   - ✅ Está activa (no revocada)
   - ✅ Tiene permisos para `generativeai` API
   - ✅ No tiene restricciones geográficas
3. Copia la clave exacta (sin espacios)

### 6. **Errores Comunes y Soluciones**

| Error | Causa | Solución |
|-------|-------|----------|
| `400 Bad Request` | API Key inválida | Verificar clave en Google AI Studio |
| `401 Unauthorized` | API Key expirada | Generar nueva clave |
| `403 Forbidden` | Cloudflare bloquea | Añadir exception en Cloudflare |
| `429 Too Many Requests` | Límite mensual excedido | Aumentar `MAX_MONTHLY_AI_CALLS` |
| `500 Internal Server Error` | Error en servidor | Ver logs de Railway |
| `504 Gateway Timeout` | Conexión lenta | Aumentar timeout en Railway |

### 7. **Reiniciar el Servicio**

En Railway Dashboard:
1. **Deployments** → Último deployment
2. Click en **Redeploy**
3. Esperar a que se reinicie

```bash
# O con CLI
railway up --force
```

## 🔍 Variables de Debug Disponibles

En `server.ts` se añadieron logs detallados. Si necesitas más información, puedes habilitar verbosidad:

```typescript
// En server.ts línea ~23, después de crear el cliente:
if (process.env.DEBUG_GEMINI === "true") {
  console.log("API Key Length:", process.env.GEMINI_API_KEY?.length);
  console.log("API Key Prefix:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
}
```

Luego en Railway:
```
DEBUG_GEMINI=true
```

## 📞 Soporte

Si el problema persiste:

1. **Revisar estado de Google APIs**: https://status.cloud.google.com/
2. **Contactar Railway Support**: railway.app/support
3. **Forum de Gemini API**: https://ai.google.dev/forums

---

**Última actualización**: 2026-05-27
