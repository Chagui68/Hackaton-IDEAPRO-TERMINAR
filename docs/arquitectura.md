# Arquitectura — Agente IDEAPRO (escalable)

## Objetivo
Producto escalable del portafolio IDEAPRO, no isla tecnológica. Este prototipo es la **puerta de entrada** que luego crece a servicios base y especializados.

```
[ Landing Agente ] → [ Servicios Base: RUP/SECOP/Kit ] → [ Servicios Especializados: Estrategia/Pliegos/Alianzas ]
        (v3 actual)               (catálogo JSON)                    (catálogo JSON + consultores)
```

## Decisiones clave

### 1. Frontend estático para validar
- Sin backend, sin build, desplegable en Pages/Vercel/S3 en 1 min.
- Valida UX + inteligencia sin costo infra.

### 2. Motor IA desacoplado `js/ia-engine.js`
- Exporta: `nlp()`, `inferirDimensiones()`, `nivelDesdeScore()`, `generarInsight()`, `recomendar()`
- Hoy: heurística + NLP ligero por keywords (rápido, offline)
- Mañana: `fetch('/api/llm', {respuestas})` → mismo contrato, 0 cambios en `app.js`
- Permite A/B test: heurística vs LLM.

### 3. Catálogo vivo `data/servicios.json`
- Negocio agrega/edita servicios sin dev.
- Cada servicio tiene `impacto: {habilitacion, secop, experiencia, capacidad}` → el motor calcula match automático.
- Ejemplo agregar:
```json
{ "id":"nuevo", "nombre":"Taller X", "impacto":{"habilitacion":20,"secop":30} }
```
  Y aparece en catálogo y recomendación.

### 4. Seguimiento evolutivo
- Hoy: `localStorage` `ideapro_hist_v3` (12 registros) + gráfico evolución.
- Migración: cambiar 2 líneas en `app.js: computeResult()` de `localStorage.setItem` a `fetch('/api/historial', {method:'POST'})`.
- Compatible con CRM: evento `recomendar()` → webhook.

### 5. Entregables tangibles
- Radar 4D (Chart.js) → visualiza brechas.
- PDF ficha (jsPDF) → comercial lo usa en llamada.
- Evolución → cliente ve progreso, reduce churn.

## Flujo completo
1. `index.html` carga → `js/app.js` hace `fetch('data/servicios.json')`
2. Usuario inicia → `preguntas[]` (8 pasos) hybrid choice/texto libre
3. Cada respuesta → `nlp()` intenta mapear + `score` + `updateRadarMini()`
4. Finish → `inferirDimensiones()` → `nivelDesdeScore()` → `generarInsight()` → `recomendar()`
5. Render: score, radarFull, brechas, recoMain, cross, ruta, guarda historial, actualiza evoChart

## Escalamiento sin reescribir
| Necesidad | Cambio |
|---|---|
| LLM real | Reemplazar `ia-engine.js` por API |
| Auth usuarios | Agregar `/login` + guardar `NIT` en perfil |
| Pagos | Integrar Wompi/Stripe en `recoMain` botón |
| CRM | POST a HubSpot en `computeResult()` |
| SECOP real | Cron que alimenta `data/oportunidades.json` y filtra por sector |

## No incluido a propósito (alcance reto)
- Pasarela pagos
- CRM completo
- Automatización ventas integral
- Integraciones complejas externas
