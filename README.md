# IDEAPRO — Agente Inteligente Mercado Público (v3 Completo)

**Puerta de entrada al ecosistema IDEAPRO.** Prototipo landing page + agente conversacional que diagnostica madurez, perfila y recomienda ruta personalizada.

> Diseñado para validar UX, inteligencia del diagnóstico y escalabilidad. Sin CRM/pagos en esta fase, pero con arquitectura lista para integrar.

## Demo
Abrir `index.html` directo o desplegar en GitHub Pages / Vercel. Estático 100%.

Live (prototipo público): https://chagui68.github.io/Hackaton-IDEAPRO/

## Qué resuelve
- Empresas no saben qué necesitan para venderle al Estado.
- Oferta IDEAPRO amplia sin diagnóstico previo genera mismatch.
- IDEAPRO no escala orientación 1:1 sin consultor.

**Solución:** agente que hace onboarding, mide 4 dimensiones, perfila, recomienda quirúrgicamente, arma ruta 90 días y hace cross-selling.

## Funcionalidades (7 exigidas)
1. **Onboarding conversacional** — híbrido botones + texto libre, NLP ligero (`js/ia-engine.js: nlp()`)
2. **Diagnóstico madurez** — 4D: habilitación / SECOP / experiencia / capacidad → score /100 + nivel (Explorador/Iniciado/En Desarrollo/Avanzado)
3. **Perfilamiento inteligente** — ficha viva + radar (`index.html: perfil-panel` + `Chart.js`)
4. **Recomendación personalizada** — motor `recomendar()` elige por impacto en brecha débil, no genérico
5. **Ruta crecimiento** — 3 fases temporizadas según nivel y dimensiones
6. **Cross-selling inteligente** — 2 complementarios por 2ª brecha débil
7. **Seguimiento** — historial `localStorage` + gráfico evolución + export JSON/PDF (`jsPDF`)

## Stack
- HTML/CSS/JS vanilla (sin build) para validación rápida
- `Chart.js 4` radar + evolución
- `jsPDF 2` ficha PDF
- `data/servicios.json` catálogo vivo escalable
- `js/ia-engine.js` motor desacoplado (hoy heurística, mañana LLM)

## Estructura
```
index.html          # landing + agente
css/style.css       # design system IDEAPRO (navy #0f1f3c + teal #00c9a7)
js/ia-engine.js     # inferencia 4D + NLP + insight + recomendación
js/app.js           # orquestación UI + chat + radar + PDF
data/servicios.json # catálogo vivo (agrega sin tocar código)
docs/arquitectura.md
```

## Cómo escalar (sin reescribir)
- **Agregar servicio:** editar `data/servicios.json` → aparece en catálogo y recomendación.
- **Cambiar a LLM real:** reemplazar `js/ia-engine.js` por llamada a `/api/diagnostico` (OpenAI/Claude) manteniendo misma interfaz `inferirDimensiones()`, `generarInsight()`, `recomendar()`.
- **Persistencia:** cambiar `localStorage` por `fetch('/api/historial')` → Supabase/Firestore.
- **CRM:** evento `reco.main` → webhook HubSpot / Pipedrive.

## Uso local
```powershell
# Abrir directo
Start-Process index.html
# O servidor simple
python -m http.server 8000
```

## Próximos pasos (post-validación)
- Conectar LLM real para conversación 100% abierta
- Auth + CRM (guardar empresa, NIT, contacto)
- Pasarela para compra de talleres
- Integración SECOP API para oportunidades reales
