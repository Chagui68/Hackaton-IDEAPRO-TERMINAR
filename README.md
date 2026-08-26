# IDEAPRO — Agente Inteligente Mercado Público (v3 Completo)

**Puerta de entrada al ecosistema IDEAPRO.** Producto final — landing + agente conversacional que diagnostica madurez, perfila y recomienda ruta personalizada.

> Producto final entregado 100% alcance reto IDEAPRO. Arquitectura lista para producción y escalamiento sin reescribir.

## Demo — Producto final
Abrir `index.html` directo o desplegar en GitHub Pages / Vercel. Estático 100%.

Live: https://chagui68.github.io/Hackaton-IDEAPRO-TERMINAR/ (privado, ver repo) · Repo final: `Hackaton-IDEAPRO-TERMINAR`

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

## Escalamiento (ya soportado sin reescribir)
- **Agregar servicio:** editar `data/servicios.json` → aparece en catálogo y recomendación.
- **LLM real:** reemplazar `js/ia-engine.js` por `/api/diagnostico` (OpenAI/Claude) manteniendo misma interfaz.
- **Persistencia:** `localStorage` → `fetch('/api/historial')` → Supabase/Firestore.
- **CRM/Pagos:** webhook HubSpot / Wompi en `reco.main`.

## Uso local
```powershell
# Abrir directo
Start-Process index.html
# O servidor simple
python -m http.server 8000
```

## Producto final — Alcance 100%
Cumple las 7 funcionalidades, recorrido completo y arquitectura escalable exigida. Evolución futura opcional (LLM 100% abierto, auth, pagos, SECOP API) ya preparada sin reescribir.
