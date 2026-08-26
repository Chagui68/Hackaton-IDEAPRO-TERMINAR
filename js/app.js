const nlp = window.IAEngine.nlp;
const inferirDimensiones = window.IAEngine.inferirDimensiones;
const nivelDesdeScore = window.IAEngine.nivelDesdeScore;
const generarInsight = window.IAEngine.generarInsight;
const recomendar = window.IAEngine.recomendar;

let servicios = [];
let preguntas = [
    {
        key: 'empresa',
        q: '¿Cómo se llama tu empresa?',
        type: 'text',
        placeholder: 'Ej: Soluciones Andinas S.A.S. - software a la medida'
    },
    {
        key: 'tam', q: 'Tamaño de la empresa', type: 'choice', opts: [
            {l: 'Micro (1-10)', v: 'Micro', pts: 5}, {
                l: 'Pequeña (11-50)',
                v: 'Pequeña',
                pts: 10
            }, {l: 'Mediana (51-200)', v: 'Mediana', pts: 15}, {l: 'Grande (+200)', v: 'Grande', pts: 15}
        ]
    },
    {
        key: 'sector', q: '¿Qué le vendes al Estado?', type: 'choice', opts: [
            {l: 'Servicios / Consultoría', v: 'Servicios', pts: 10}, {
                l: 'Tecnología / Software',
                v: 'Tecnología',
                pts: 10
            }, {l: 'Obra / Infraestructura', v: 'Obra', pts: 10}, {
                l: 'Bienes / Suministros',
                v: 'Bienes',
                pts: 10
            }, {l: 'Aún no lo tengo claro', v: 'Indefinido', pts: 0}
        ]
    },
    {
        key: 'exp', q: 'Experiencia en contratación pública', type: 'choice', opts: [
            {l: 'Nunca he participado', v: 'Nunca', pts: 0}, {
                l: 'Me he registrado pero nunca oferté',
                v: 'Registrado',
                pts: 10
            }, {l: 'Oferté 1-3 veces (sin ganar)', v: 'Ofertó', pts: 20}, {
                l: 'Ya he ganado contratos',
                v: 'Ganador',
                pts: 35
            }
        ]
    },
    {
        key: 'rup', q: '¿RUP vigente?', type: 'choice', opts: [
            {l: 'No tengo / vencido', v: 'No', pts: 0}, {l: 'En trámite', v: 'Trámite', pts: 10}, {
                l: 'Sí, vigente',
                v: 'Sí',
                pts: 20
            }
        ]
    },
    {
        key: 'secop', q: 'Manejo de SECOP II', type: 'choice', opts: [
            {l: 'No lo conozco', v: 'Nulo', pts: 0}, {
                l: 'Básico (entro y busco)',
                v: 'Básico',
                pts: 10
            }, {l: 'Intermedio (he ofertado)', v: 'Intermedio', pts: 20}, {
                l: 'Avanzado (gestiono todo)',
                v: 'Avanzado',
                pts: 30
            }
        ]
    },
    {
        key: 'equipo', q: '¿Equipo dedicado a licitaciones?', type: 'choice', opts: [
            {l: 'Nadie / solo yo', v: 'Nadie', pts: 0}, {
                l: '1 persona parcial',
                v: 'Parcial',
                pts: 10
            }, {l: 'Equipo 2-3 personas', v: 'Equipo', pts: 20}, {l: 'Área estructurada', v: 'Área', pts: 25}
        ]
    },
    {
        key: 'objetivo', q: 'Objetivo principal a 6 meses', type: 'choice', opts: [
            {l: 'Ganar primer contrato', v: 'Primer contrato', pts: 5}, {
                l: 'Aumentar contratos actuales',
                v: 'Escalar',
                pts: 10
            }, {l: 'Diversificar entidades', v: 'Diversificar', pts: 10}, {
                l: 'Estructurar área de contratación',
                v: 'Estructurar',
                pts: 10
            }
        ]
    }
];

let idx = 0, respuestas = {}, score = 0, chatLocked = false;
let radarMiniChart = null, radarFullChart = null, evoChart = null;
let modoLibrePendiente = false;

const el = id => document.getElementById(id);

function addMsg(txt, who = 'bot') {
    const c = el('chatBody');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = txt;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
}

function addTyping() {
    const c = el('chatBody');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.id = 'typing';
    d.innerHTML = '<em>● ● ● escribiendo...</em>';
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
}

function removeTyping() {
    const t = el('typing');
    if (t) t.remove();
}

function updateProgress() {
    const bar = el('progressBar'), txt = el('progressTxt');
    if (bar) bar.style.width = Math.round((idx / preguntas.length) * 100) + '%';
    if (txt) txt.textContent = idx === 0 ? 'Listo para iniciar' : idx >= preguntas.length ? 'Completado • 100%' : `Pregunta ${idx}/${preguntas.length} • ${Math.round((idx / preguntas.length) * 100)}%`;
    if (respuestas.empresa && el('pEmpresa')) el('pEmpresa').textContent = respuestas.empresa;
    if (respuestas.sector && el('pSector')) el('pSector').textContent = respuestas.sector;
    if (respuestas.tam && el('pTam')) el('pTam').textContent = respuestas.tam;
    if (respuestas.exp && el('pExp')) el('pExp').textContent = respuestas.exp;
    if (respuestas.rup && el('pRup')) el('pRup').textContent = respuestas.rup;
    if (respuestas.secop && el('pSecop')) el('pSecop').textContent = respuestas.secop;
    if (respuestas.equipo && el('pEquipo')) el('pEquipo').textContent = respuestas.equipo;
    if (respuestas.objetivo && el('pObj')) el('pObj').textContent = respuestas.objetivo;
    if (Object.keys(respuestas).length > 0) {
        const card = el('perfilCard');
        if (card) {
            const empty = card.querySelector('.perfil-empty');
            const data = el('perfilData');
            if (empty) empty.style.display = 'none';
            if (data) data.style.display = 'block';
        }
        updateRadarMini();
    }
}

function updateRadarMini() {
    try {
        if (typeof Chart === 'undefined') return;
        const dims = inferirDimensiones(respuestas);
        const filled = Object.keys(respuestas).filter(k => !k.startsWith('_')).length;
        if (filled < 2) return;
        const wrap = el('radarWrap');
        if (wrap) wrap.style.display = 'block';
        const ctx = el('radarMini');
        if (!ctx) return;
        const data = [dims.habilitacion, dims.secop, dims.experiencia, dims.capacidad];
        if (radarMiniChart) {
            try {
                radarMiniChart.destroy();
            } catch (e) {
            }
            radarMiniChart = null;
        }
        radarMiniChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Habilitación', 'SECOP', 'Experiencia', 'Capacidad'],
                datasets: [{
                    label: 'Madurez',
                    data,
                    backgroundColor: 'rgba(0,201,167,.18)',
                    borderColor: '#00c9a7',
                    pointBackgroundColor: '#0f1f3c'
                }]
            },
            options: {
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {stepSize: 25, display: false},
                        pointLabels: {font: {size: 9}}
                    }
                }, plugins: {legend: {display: false}}, animation: false, responsive: true
            }
        });
    } catch (e) {
        console.log('radarMini error', e);
    }
}

function renderQuestion() {
    if (idx >= preguntas.length) {
        finish();
        return;
    }
    const p = preguntas[idx];
    addTyping();
    setTimeout(() => {
        removeTyping();
        addMsg(`<strong>P${idx + 1}/${preguntas.length}:</strong> ${p.q}${p.type === 'choice' ? `<br><span style="color:#64748b;font-size:.78em">Elige una opción o escribe libre — la IA entiende</span>` : ''}`);
        const optBox = el('chatOptions');
        if (!optBox) return;
        optBox.innerHTML = '';
        if (p.type === 'choice') {
            p.opts.forEach(o => {
                const b = document.createElement('button');
                b.className = 'opt-btn';
                b.textContent = o.l;
                b.onclick = () => answer(p.key, o.v, o.pts);
                optBox.appendChild(b);
            });
        } else {
            optBox.innerHTML = '<span style="font-size:.8rem;color:#64748b">Escribe tu respuesta y presiona Enviar</span>';
        }
        const row = el('chatInputRow');
        if (row) row.style.display = 'flex';
        const inp = el('freeInput');
        if (inp) {
            inp.placeholder = p.type === 'text' ? p.placeholder : 'O escribe libre: ej. "somos 5 y nunca hemos licitado"';
            inp.value = '';
            inp.focus();
        }
        updateProgress();
        chatLocked = false;
    }, 380);
}

function answer(key, val, pts) {
    if (chatLocked) return;
    chatLocked = true;
    respuestas[key] = val;
    if (pts !== undefined) score += pts;
    else {
        let extra = val.length > 12 ? 10 : 6;
        score += extra;
        try {
            const inf = nlp(val);
            if (key === 'empresa' && inf.sector) respuestas._inferSector = inf.sector;
        } catch (e) {
        }
    }
    addMsg(val, 'user');
    setTimeout(() => {
        let fb = '';
        if (key === 'rup' && val === 'No') fb = 'Sin RUP no pasas el primer filtro. Lo ponemos de primero en tu ruta.';
        else if (key === 'secop' && val === 'Nulo') fb = 'Tranqui, 60% empieza así. En 2 semanas lo dejas en intermedio.';
        else if (key === 'exp' && val === 'Ganador') fb = 'Excelente tracción. Vamos a escalar ticket.';
        else if (key === 'sector' && val === 'Indefinido') fb = 'Esa es la brecha #1: si tú no tienes clara la oferta, el evaluador menos.';
        if (fb) addMsg(fb);
    }, 280);
    idx++;
    setTimeout(renderQuestion, 650);
}

function sendFreeText() {
    if (modoLibrePendiente) return;
    const inp = el('freeInput');
    if (!inp) return;
    const v = inp.value.trim();
    if (!v) return;
    if (v.length < 2) {
        addMsg('Escribe al menos 2 caracteres', 'bot');
        return;
    }
    const p = preguntas[idx];
    if (!p) {
        addMsg(v, 'user');
        inp.value = '';
        return;
    }
    if (p.type === 'text') {
        if (p.key === 'empresa' && (v.length < 3 || /^(hola|test|lol|asdf|xxx)$/i.test(v.trim()))) {
            addMsg('Ese nombre es muy genérico. Pon el nombre real o "Proyecto en formación". Ej: "Estudio Kumo S.A.S."', 'bot');
            return;
        }
        answer(p.key, v);
        return;
    }
    const lower = v.toLowerCase();
    const exact = p.opts.find(o => lower.includes(o.v.toLowerCase()) || o.l.toLowerCase().includes(lower) || lower.includes(o.l.toLowerCase().split(' ')[0]));
    if (exact) {
        answer(p.key, exact.v, exact.pts);
        return;
    }
    let mapped = null, pts = 0;
    try {
        const inf = nlp(v);
        if (p.key === 'sector' && inf.sector) {
            mapped = inf.sector;
            pts = 10;
        } else if (p.key === 'rup' && inf.rup) {
            mapped = inf.rup;
            pts = inf.rup === "Sí" ? 20 : inf.rup === "Trámite" ? 10 : 0;
        } else if (p.key === 'secop' && inf.secop) {
            mapped = inf.secop;
            pts = inf.secop === "Avanzado" ? 30 : inf.secop === "Intermedio" ? 20 : inf.secop === "Básico" ? 10 : 0;
        } else if (p.key === 'exp' && inf.exp) {
            mapped = inf.exp;
            pts = inf.exp === "Ganador" ? 35 : inf.exp === "Ofertó" ? 20 : inf.exp === "Registrado" ? 10 : 0;
        } else if (p.key === 'equipo' && inf.equipo) {
            mapped = inf.equipo;
            pts = inf.equipo === "Área" ? 25 : inf.equipo === "Equipo" ? 20 : inf.equipo === "Parcial" ? 10 : 0;
        } else if (p.key === 'tam') {
            if (lower.match(/micro|1-10/)) {
                mapped = "Micro";
                pts = 5
            } else if (lower.match(/peque|11-50/)) {
                mapped = "Pequeña";
                pts = 10
            } else if (lower.match(/mediana|50-200/)) {
                mapped = "Mediana";
                pts = 15
            } else if (lower.match(/grande|\+200/)) {
                mapped = "Grande";
                pts = 15
            }
        } else if (p.key === 'objetivo' && inf.objetivo) {
            mapped = inf.objetivo;
            pts = 10;
        }
    } catch (e) {
    }
    if (mapped) {
        addMsg(v, 'user');
        addMsg(`<em>Entendido como: <strong>${mapped}</strong> (IA interpretó tu texto libre)</em>`);
        respuestas[p.key] = mapped;
        score += pts;
        idx++;
        chatLocked = false;
        inp.value = '';
        setTimeout(renderQuestion, 650);
        return;
    }
    addMsg(v, 'user');
    addMsg(`No mapeé exacto, lo tomo como <strong>${v}</strong>. Si querías otra opción, elige el botón.`);
    respuestas[p.key] = v;
    score += 8;
    idx++;
    chatLocked = false;
    inp.value = '';
    setTimeout(renderQuestion, 650);
}

function resetState() {
    idx = 0;
    score = 0;
    respuestas = {};
    chatLocked = false;
    modoLibrePendiente = false;
    const body = el('chatBody');
    if (body) body.innerHTML = '';
    const res = el('resultados');
    if (res) res.style.display = 'none';
    const row = el('chatInputRow');
    if (row) row.style.display = 'none';
    const card = el('perfilCard');
    if (card) {
        const empty = card.querySelector('.perfil-empty');
        const data = el('perfilData');
        if (empty) empty.style.display = 'block';
        if (data) data.style.display = 'none';
    }
    const wrap = el('radarWrap');
    if (wrap) wrap.style.display = 'none';
    const guia = el('guiaLibre');
    if (guia) guia.style.display = 'none';
    const bar = el('progressBar');
    if (bar) bar.style.width = '0%';
    const txt = el('progressTxt');
    if (txt) txt.textContent = 'Reiniciado • Listo para iniciar';
    ['pEmpresa', 'pSector', 'pTam', 'pExp', 'pRup', 'pSecop', 'pEquipo', 'pObj'].forEach(id => {
        const e = el(id);
        if (e) e.textContent = '-';
    });
    if (radarMiniChart) {
        try {
            radarMiniChart.destroy();
        } catch (e) {
        }
        radarMiniChart = null;
    }
    if (radarFullChart) {
        try {
            radarFullChart.destroy();
        } catch (e) {
        }
        radarFullChart = null;
    }
}

function startAgent() {
    resetState();
    addMsg('Perfecto. Vamos paso a paso. <strong>Puedes clickear o escribir libre</strong> — la IA entiende ambas. Esto alimenta tu perfil y el diagnóstico 4D.');
    setTimeout(renderQuestion, 480);
    renderHistorial();
    updateEvoChart();
}

window.startAgent = startAgent;

function modoLibre() {
    resetState();
    modoLibrePendiente = true;
    addMsg('Modo libre activado. <strong>Cuéntame de tu empresa en 2-3 frases</strong> y la IA inferirá tu perfil. Ej: "Somos 8 personas, hacemos software, nunca hemos licitado, no tenemos RUP"');
    const row = el('chatInputRow');
    if (row) row.style.display = 'flex';
    const inp = el('freeInput');
    if (inp) {
        inp.placeholder = 'Describe tu empresa libremente...';
        inp.value = '';
        inp.focus();
    }
    const opt = el('chatOptions');
    if (opt) opt.innerHTML = '<span style="font-size:.8rem;color:#64748b">Escribe tu descripción abajo y presiona <strong>Enviar</strong> →</span>';
    const guia = el('guiaLibre');
    if (guia) guia.style.display = 'block';
    actualizarGuiaCheck();
    if (inp) inp.addEventListener('input', actualizarGuiaCheck);
}

window.modoLibre = modoLibre;
window.toggleGuia = function () {
    const g = el('guiaLibre');
    if (g) g.style.display = g.style.display === 'none' ? 'block' : 'none';
}
window.usarEjemplo = function (n) {
    const ejemplos = [
        "Somos 5 personas, hacemos videojuegos educativos, nunca hemos licitado y no tenemos RUP ni experiencia en SECOP",
        "Somos 12 personas en obra civil e infraestructura, con RUP en trámite, hemos ofertado 2 veces sin ganar, manejo SECOP básico y queremos nuestro primer contrato",
        "Somos 3 consultores en servicios empresariales, ya ganamos un contrato con el Estado, tenemos RUP vigente y SECOP intermedio, queremos escalar y diversificar entidades"
    ];
    const inp = el('freeInput');
    if (inp) {
        inp.value = ejemplos[n] || ejemplos[0];
        inp.focus();
        actualizarGuiaCheck();
    }
}

function actualizarGuiaCheck() {
    const inp = el('freeInput');
    const box = el('guiaCheck');
    if (!box) return;
    const v = (inp && inp.value || '').toLowerCase();
    let inf = {};
    try {
        inf = nlp(v);
    } catch (e) {
    }
    const checks = [
        {label: 'Tamaño', ok: /\d+/.test(v) || /micro|pequeña|mediana|personas|equipo/.test(v)},
        {
            label: 'Oferta / Sector',
            ok: !!inf.sector || /videojuego|software|obra|servicio|consult|bienes|suministro|hacemos|ofrecemos/.test(v)
        },
        {label: 'Experiencia Estado', ok: !!inf.exp || /licitado|contrato|ofertado|nunca|ganamos/.test(v)},
        {label: 'RUP / SECOP', ok: !!inf.rup || !!inf.secop || /rup|secop/.test(v)}
    ];
    box.innerHTML = checks.map(c => `<div class="${c.ok ? 'ok' : 'no'}"><span>${c.label}</span><span>${c.ok ? '✓' : '○'}</span></div>`).join('');
}

function procesarModoLibre() {
    if (!modoLibrePendiente) return;
    const inp = el('freeInput');
    if (!inp) return;
    const v = inp.value.trim();
    if (!v || v.length < 15 || v.split(/\s+/).length < 4) {
        addMsg('Muy corto/genérico. Necesito más detalle: ¿cuántas personas, qué le venderían al Estado y si han licitado antes?<br>Ej: <em>"Somos 5, hacemos videojuegos para educación, nunca hemos licitado y no tenemos RUP"</em>', 'bot');
        return;
    }
    let inf = {};
    try {
        inf = nlp(v);
    } catch (e) {
    }
    const isGenericGreeting = /^(hola|hi|hello|buenas|soy|lol|test|prueba)[\s,!.]*$/i.test(v.trim()) || (v.toLowerCase().includes('hola') && v.length < 20);
    const hasBusinessSignal = inf.sector || inf.rup || inf.secop || inf.exp || inf.equipo || /\d+/.test(v) || /empresa|personas|equipo|hacemos|somos|ofrecemos|vendemos|servicio|producto|software|obra|videojuego|desarrollo/i.test(v);
    if (isGenericGreeting || !hasBusinessSignal) {
        addMsg('No pude entender tu empresa con eso. Sé más específico:<br>• ¿Cuántas personas son?<br>• ¿Qué producto/servicio le venderían al Estado?<br>• ¿Tienen RUP / han usado SECOP?<br>Ej: <em>"Somos 5, hacemos videojuegos educativos, sin RUP, nunca en SECOP"</em>', 'bot');
        return;
    }
    modoLibrePendiente = false;
    const guia = el('guiaLibre');
    if (guia) guia.style.display = 'none';
    addMsg(v, 'user');
    inp.value = '';
    respuestas.empresa = v.split(' ').slice(0, 3).join(' ') + ' (inferida)';
    respuestas.sector = inf.sector || 'Servicios';
    respuestas.rup = inf.rup || 'No';
    respuestas.secop = inf.secop || 'Nulo';
    respuestas.exp = inf.exp || 'Nunca';
    respuestas.equipo = inf.equipo || 'Nadie';
    respuestas.objetivo = inf.objetivo || 'Primer contrato';
    const m = v.match(/\d+/);
    respuestas.tam = m ? (parseInt(m[0]) < 11 ? 'Micro' : parseInt(m[0]) < 51 ? 'Pequeña' : 'Mediana') : 'Pequeña';
    score = 10 + (inf.rup === "Sí" ? 20 : inf.rup === "Trámite" ? 10 : 0) + (inf.secop === "Avanzado" ? 30 : inf.secop === "Intermedio" ? 20 : inf.secop === "Básico" ? 10 : 0) + (inf.exp === "Ganador" ? 35 : inf.exp === "Ofertó" ? 20 : 0);
    const conf = [inf.sector, inf.rup, inf.secop, inf.exp].filter(Boolean).length;
    if (conf < 2) {
        addMsg(`Gracias. Inferí: Sector <strong>${respuestas.sector}</strong>, RUP <strong>${respuestas.rup}</strong>, SECOP <strong>${respuestas.secop}</strong>, Exp <strong>${respuestas.exp}</strong>.<br>Quedo con inferencia parcial (${conf}/4 señales). Ahora te hago 1 pregunta fina para cerrar.`, 'bot');
    } else {
        addMsg(`Gracias. Inferí: Sector <strong>${respuestas.sector}</strong>, RUP <strong>${respuestas.rup}</strong>, SECOP <strong>${respuestas.secop}</strong>, Exp <strong>${respuestas.exp}</strong>.<br>Ahora te hago 1 pregunta fina para afinar.`, 'bot');
    }
    idx = preguntas.findIndex(p => p.key === 'objetivo');
    if (idx < 0) idx = 7;
    setTimeout(renderQuestion, 700);
}

window.procesarModoLibre = procesarModoLibre;

function loadDemo() {
    resetState();
    respuestas = {
        empresa: 'ConstruMetálicas S.A.S.',
        tam: 'Pequeña',
        sector: 'Obra',
        exp: 'Ofertó',
        rup: 'Trámite',
        secop: 'Básico',
        equipo: 'Parcial',
        objetivo: 'Primer contrato'
    };
    score = 65;
    idx = preguntas.length;
    updateProgress();
    addMsg('ConstruMetálicas S.A.S.', 'user');
    addMsg('Demo cargada. Perfil con brechas reales: RUP en trámite + SECOP básico. Mira el diagnóstico abajo.');
    finish(true);
}

window.loadDemo = loadDemo;

function finish(isDemo) {
    const opt = el('chatOptions');
    if (opt) opt.innerHTML = `<button class="btn-primary" onclick="startAgent()">↻ Reiniciar diagnóstico</button><button class="btn-ghost" onclick="loadDemo()">Ver otro ejemplo</button>`;
    const row = el('chatInputRow');
    if (row) row.style.display = 'none';
    const guia = el('guiaLibre');
    if (guia) guia.style.display = 'none';
    if (!isDemo) {
        addTyping();
        setTimeout(() => {
            removeTyping();
            addMsg('Listo, ya tengo todo. <strong>Analizando con motor 4D + recomendación quirúrgica...</strong>');
        }, 380);
    }
    setTimeout(computeResult, isDemo ? 180 : 850);
}

function computeResult() {
    try {
        const norm = Math.min(100, Math.round((score / 125) * 100));
        const dims = inferirDimensiones(respuestas);
        const nivelInfo = nivelDesdeScore(norm);
        const intel = generarInsight(respuestas, dims, norm, nivelInfo.nivel);
        const reco = recomendar(servicios, respuestas, dims, nivelInfo.nivel);
        const resSec = el('resultados');
        if (resSec) resSec.style.display = 'block';
        const t1 = el('resTitle');
        if (t1) t1.textContent = `Tu nivel: ${nivelInfo.nivel} • ${norm}/100`;
        const t2 = el('resDesc');
        if (t2) t2.innerHTML = `${intel.analisis}<br><br>${intel.causa}<br><em style="color:#e2e8f0">${intel.objTxt}</em><br><small style="color:#93c5fd">${intel.accion}</small>`;
        const sn = el('scoreNum');
        if (sn) sn.textContent = norm;
        const gf = el('gaugeFill');
        if (gf) {
            gf.style.width = norm + '%';
            gf.style.background = nivelInfo.color;
        }
        const eb = el('resEyebrow');
        if (eb) eb.textContent = `DIAGNÓSTICO IA 4D • ${respuestas.empresa || 'Empresa'} • ${respuestas.sector || respuestas._inferSector || ''} • v3`;
        const brechas = [];
        if (dims.habilitacion < 50) brechas.push(`Habilitación ${dims.habilitacion}% → RUP/oferta floja: te descalifican antes de competir`);
        if (dims.secop < 50) brechas.push(`SECOP ${dims.secop}% → errores de forma que cuestan contratos`);
        if (dims.experiencia < 40) brechas.push(`Experiencia ${dims.experiencia}% → falta curva y casos`);
        if (dims.capacidad < 50) brechas.push(`Capacidad ${dims.capacidad}% → equipo insuficiente para volumen`);
        if (brechas.length === 0) brechas.push(`Perfil balanceado • todas >60% → toca escalar ticket`);
        brechas.push(`<small style="color:#64748b">Radar: H ${dims.habilitacion}% | S ${dims.secop}% | E ${dims.experiencia}% | C ${dims.capacidad}%</small>`);
        const bl = el('brechasList');
        if (bl) bl.innerHTML = brechas.map(b => `<li class="${b.includes('Radar') ? 'radar' : ''}">${b.includes('Radar') ? b : '⚠ ' + b}</li>`).join('');
        const ctxFull = el('radarFull');
        if (ctxFull && typeof Chart !== 'undefined') {
            if (radarFullChart) {
                try {
                    radarFullChart.destroy();
                } catch (e) {
                }
            }
            radarFullChart = new Chart(ctxFull, {
                type: 'radar',
                data: {
                    labels: ['Habilitación', 'SECOP', 'Experiencia', 'Capacidad'],
                    datasets: [{
                        label: 'Tu empresa',
                        data: [dims.habilitacion, dims.secop, dims.experiencia, dims.capacidad],
                        backgroundColor: 'rgba(0,201,167,.18)',
                        borderColor: '#00c9a7',
                        pointBackgroundColor: '#0f1f3c'
                    }, {
                        label: 'Meta 80%',
                        data: [80, 80, 80, 80],
                        borderColor: '#e2e8f0',
                        backgroundColor: 'transparent',
                        borderDash: [6, 4],
                        pointRadius: 0
                    }]
                },
                options: {
                    scales: {r: {min: 0, max: 100, ticks: {stepSize: 20}, pointLabels: {font: {size: 11}}}},
                    plugins: {legend: {position: 'bottom'}},
                    animation: true
                }
            });
        }
        const main = reco.main;
        const rm = el('recoMain');
        if (rm) rm.innerHTML = `
      <div class="reco-main">
        <span class="tag">${main.tipo}</span><span class="tag" style="background:#00c9a7;color:#0f1f3c">IA: ${reco.debil} prioritario</span><span class="tag" style="background:#fff;color:#0f1f3c;border:1px solid #e2e8f0">${main.precio} • ${main.duracion}</span>
        <h4>${main.nombre}</h4><p>${main.desc}</p>
        <p><strong>Por qué este y no otro:</strong> Tu dimensión más débil es <strong>${intel.debMap[reco.debil]} (${dims[reco.debil]}%)</strong>. Este servicio la lleva a 70%+ en 30 días. Impacto: +${main.impacto[reco.debil]} pts en esa dimensión.</p>
        <p style="background:#fff;padding:8px;border-radius:8px;border:1px solid #e2e8f0"><strong>Insight IA:</strong> ${intel.objTxt}</p>
        <button class="btn-primary" style="margin-top:8px" onclick="alert('Prototipo: aquí se agenda con consultor IDEAPRO para ${main.nombre}')">Quiero este servicio →</button>
      </div>`;
        const rc = el('recoCross');
        if (rc) rc.innerHTML = reco.cross.map(c => `
      <div class="cross-card"><span class="tag">${c.tipo}</span><h5>${c.nombre}</h5><p>${c.desc}</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><small style="color:#64748b">${c.precio}</small><small style="color:#2563eb;font-weight:700;cursor:pointer" onclick="alert('Cross-selling: ${c.nombre} agregado a tu ruta (impacto +${c.impacto[reco.debil] || 10}%)')">+ Agregar</small></div></div>
    `).join('');
        const rutas = {
            'EXPLORADOR': [
                {
                    f: 'Fase 1 • 0-30 días',
                    t: 'Habilitación',
                    d: `RUP + diagnóstico + SECOP básico. H ${dims.habilitacion}% → 65%.`
                },
                {f: 'Fase 2 • 1-3 meses', t: 'Primera oferta', d: 'Mentoría oferta + simulador + oferta real guiada.'},
                {f: 'Fase 3 • 3-6 meses', t: 'Tracción', d: 'Estrategia comercial + 3 procesos priorizados.'}
            ],
            'INICIADO': [
                {
                    f: 'Fase 1 • 0-30 días',
                    t: 'Corrección',
                    d: `SECOP intermedio + kit jurídico. S ${dims.secop}% → 75%.`
                },
                {f: 'Fase 2 • 1-3 meses', t: 'Ofertas', d: 'Mentoría + simulador + 2 ofertas.'},
                {f: 'Fase 3 • 3-6 meses', t: 'Escala', d: 'Estrategia + financiero para cupos.'}
            ],
            'EN DESARROLLO': [
                {
                    f: 'Fase 1 • 0-15 días',
                    t: 'Estrategia',
                    d: `Consultoría Estado + mapa entidades. C ${dims.capacidad}% optimizada.`
                },
                {f: 'Fase 2 • 1-2 meses', t: 'Optimización', d: 'Simulador + financiero + pliegos tipo.'},
                {f: 'Fase 3 • 3-6 meses', t: 'Crecimiento', d: 'Alianzas y diversificación.'}
            ],
            'AVANZADO': [
                {f: 'Fase 1 • 0-15 días', t: 'Auditoría', d: 'Revisión pliegos ganados/perdidos.'},
                {f: 'Fase 2 • 1-3 meses', t: 'Escalamiento', d: 'Consorcios + contratos mayor cuantía.'},
                {f: 'Fase 3 • 3-6 meses', t: 'Liderazgo', d: 'Posicionamiento como proveedor estratégico.'}
            ]
        };
        const rs = el('rutaSteps');
        if (rs) rs.innerHTML = rutas[nivelInfo.nivel].map(r => `<div class="step"><span>${r.f}</span><h4>${r.t}</h4><p>${r.d}</p></div>`).join('');
        const registro = {
            fecha: new Date().toISOString(),
            fechaStr: new Date().toLocaleString(),
            empresa: respuestas.empresa || 'Anónima',
            nivel: nivelInfo.nivel,
            norm,
            score,
            dims
        };
        let hist = JSON.parse(localStorage.getItem('ideapro_hist_v3') || '[]');
        hist.unshift(registro);
        hist = hist.slice(0, 12);
        localStorage.setItem('ideapro_hist_v3', JSON.stringify(hist));
        localStorage.setItem('ideapro_last_v3', JSON.stringify({
            respuestas,
            nivel: nivelInfo.nivel,
            norm,
            dims,
            intel,
            reco
        }));
        renderHistorial();
        updateEvoChart();
        if (resSec) resSec.scrollIntoView({behavior: 'smooth'});
        updateProgress();
    } catch (e) {
        console.error(e);
        addMsg('Error en diagnóstico: ' + e.message + ' — revisa consola', 'bot');
    }
}

function renderHistorial() {
    const hist = JSON.parse(localStorage.getItem('ideapro_hist_v3') || '[]');
    const hb = el('historialBox'), hd = el('histDetalle');
    if (!hb || !hd) return;
    if (hist.length === 0) {
        hb.innerHTML = '<span class="historial-empty">Sin historial. Al finalizar se guarda localmente.</span>';
        hd.innerHTML = '<span style="color:#64748b;font-size:.85rem">Sin datos aún. Haz tu primer diagnóstico.</span>';
        return;
    }
    hb.innerHTML = hist.slice(0, 5).map(h => `<div class="hist-item"><span><strong>${h.empresa.substring(0, 18)}</strong> • ${h.nivel} ${h.norm}%</span><span>${h.fechaStr.split(',')[0]}</span></div>`).join('');
    hd.innerHTML = hist.map(h => `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#f8fafc">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:.85rem">${h.empresa}</strong><span style="font-family:'JetBrains Mono',monospace;font-size:.7rem;background:#0f1f3c;color:#fff;padding:3px 8px;border-radius:999px">${h.nivel} ${h.norm}%</span></div>
      <div style="font-size:.75rem;color:#64748b;margin-top:4px">${h.fechaStr} • H${h.dims.habilitacion} S${h.dims.secop} E${h.dims.experiencia} C${h.dims.capacidad}</div>
    </div>
  `).join('');
}

window.clearHistorial = function () {
    localStorage.removeItem('ideapro_hist_v3');
    localStorage.removeItem('ideapro_last_v3');
    renderHistorial();
    updateEvoChart();
}

function updateEvoChart() {
    try {
        if (typeof Chart === 'undefined') return;
        const hist = JSON.parse(localStorage.getItem('ideapro_hist_v3') || '[]').slice().reverse();
        const ctx = el('evoChart');
        if (!ctx) return;
        if (evoChart) {
            try {
                evoChart.destroy();
            } catch (e) {
            }
            evoChart = null;
        }
        if (hist.length === 0) {
            evoChart = new Chart(ctx, {
                type: 'line',
                data: {labels: ['Sin datos'], datasets: [{label: 'Madurez', data: [0]}]},
                options: {plugins: {legend: {display: false}}, scales: {y: {min: 0, max: 100}}}
            });
            return;
        }
        evoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hist.map((h, i) => `#${i + 1} ${h.nivel.substring(0, 3)}`),
                datasets: [{
                    label: 'Madurez /100',
                    data: hist.map(h => h.norm),
                    borderColor: '#00c9a7',
                    backgroundColor: 'rgba(0,201,167,.12)',
                    fill: true,
                    tension: .35,
                    pointBackgroundColor: '#0f1f3c'
                }]
            },
            options: {
                responsive: true,
                plugins: {legend: {display: false}},
                scales: {y: {min: 0, max: 100, ticks: {stepSize: 20}}, x: {ticks: {font: {size: 9}}}}
            }
        });
    } catch (e) {
        console.log('evo error', e);
    }
}

window.exportPerfil = function (tipo) {
    const data = JSON.parse(localStorage.getItem('ideapro_last_v3') || 'null');
    if (!data) {
        alert('Haz un diagnóstico primero');
        return;
    }
    if (tipo === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `perfil_${(data.respuestas.empresa || 'ideapro').replace(/\s+/g, '_')}.json`;
        a.click();
    } else if (tipo === 'pdf') {
        try {
            const {jsPDF} = window.jspdf;
            if (!jsPDF) {
                alert('jsPDF no cargó (¿sin internet?)');
                return;
            }
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text("IDEAPRO - Ficha Diagnóstico", 14, 18);
            doc.setFontSize(9);
            doc.text(`Empresa: ${data.respuestas.empresa || '-'}  |  Sector: ${data.respuestas.sector || '-'}  |  Fecha: ${new Date().toLocaleString()}`, 14, 26);
            doc.setFontSize(12);
            doc.text(`Nivel: ${data.nivel}  -  ${data.norm}/100`, 14, 34);
            doc.setFontSize(9);
            doc.text(`Habilitación: ${data.dims.habilitacion}%  SECOP: ${data.dims.secop}%  Experiencia: ${data.dims.experiencia}%  Capacidad: ${data.dims.capacidad}%`, 14, 40);
            doc.setFontSize(10);
            doc.text("Análisis IA:", 14, 48);
            const split = doc.splitTextToSize(data.intel ? data.intel.analisis : "", 180);
            doc.setFontSize(8);
            doc.text(split, 14, 54);
            doc.text(`Recomendación principal: ${data.reco ? data.reco.main.nombre : "-"}`, 14, 78);
            doc.text(`Por qué: Dimensión débil ${data.reco ? data.reco.debil : "-"}`, 14, 84);
            doc.text(`Ruta 90 días: Ver detalle en plataforma`, 14, 92);
            doc.setFontSize(7);
            doc.text("Generado por Agente IDEAPRO v3 - Prototipo escalable", 14, 285);
            doc.save(`ficha_ideapro_${(data.respuestas.empresa || 'empresa').replace(/\s+/g, '_')}.pdf`);
        } catch (e) {
            alert('Error PDF: ' + e.message);
        }
    }
}

async function loadServicios() {
    try {
        const r = await fetch('data/servicios.json');
        if (!r.ok) throw new Error('fetch fail');
        servicios = await r.json();
    } catch (e) {
        servicios = [
            {
                id: 'diag360',
                nombre: 'Diagnóstico 360 Mercado Público',
                tipo: 'Diagnóstico',
                desc: 'Radiografía completa: jurídica, financiera, técnica y comercial.',
                nivel: 'Explorador',
                tag: 'Puerta de entrada',
                precio: 'Gratuito',
                duracion: '2 días',
                impacto: {habilitacion: 30, secop: 10, experiencia: 15, capacidad: 10}
            },
            {
                id: 'rup',
                nombre: 'Taller RUP Express',
                tipo: 'Herramienta',
                desc: 'Inscripción, renovación y actualización sin errores.',
                nivel: 'Explorador',
                tag: 'Habilitador',
                precio: '$ 280.000',
                duracion: '4 horas',
                impacto: {habilitacion: 45, secop: 5, experiencia: 5, capacidad: 5}
            },
            {
                id: 'secop-bas',
                nombre: 'Curso SECOP II Básico',
                tipo: 'Capacitación',
                desc: 'Cuenta, búsqueda inteligente, alertas y primera oferta.',
                nivel: 'Explorador',
                tag: 'Básico',
                precio: '$ 350.000',
                duracion: '8 horas',
                impacto: {habilitacion: 10, secop: 40, experiencia: 10, capacidad: 5}
            },
            {
                id: 'secop-int',
                nombre: 'SECOP II Intermedio + Pliegos Tipo',
                tipo: 'Capacitación',
                desc: 'Lectura crítica de pliegos y evitar rechazos.',
                nivel: 'Iniciado',
                tag: 'Intermedio',
                precio: '$ 580.000',
                duracion: '12 horas',
                impacto: {habilitacion: 15, secop: 35, experiencia: 20, capacidad: 10}
            },
            {
                id: 'oferta',
                nombre: 'Mentoría Perfilamiento de Oferta',
                tipo: 'Mentoría',
                desc: 'Ajusta portafolio para que el Estado sí te compre.',
                nivel: 'Iniciado',
                tag: 'Mentoría',
                precio: '$ 720.000',
                duracion: '3 sesiones',
                impacto: {habilitacion: 25, secop: 10, experiencia: 20, capacidad: 15}
            },
            {
                id: 'juridico',
                nombre: 'Kit Capacidad Jurídica y Financiera',
                tipo: 'Herramienta',
                desc: 'Checklists y modelos de indicadores.',
                nivel: 'Iniciado',
                tag: 'Kit',
                precio: '$ 320.000',
                duracion: 'Autogestión',
                impacto: {habilitacion: 20, secop: 10, experiencia: 10, capacidad: 25}
            },
            {
                id: 'simulador',
                nombre: 'Simulador de Licitación Real',
                tipo: 'Herramienta',
                desc: 'Simula proceso completo con retroalimentación.',
                nivel: 'En Desarrollo',
                tag: 'Práctica',
                precio: '$ 450.000',
                duracion: '1 semana',
                impacto: {habilitacion: 10, secop: 25, experiencia: 35, capacidad: 15}
            },
            {
                id: 'estrategia',
                nombre: 'Consultoría Estrategia Comercial Estado',
                tipo: 'Consultoría',
                desc: 'Plan 90 días: entidades y pipeline.',
                nivel: 'En Desarrollo',
                tag: 'Estratégico',
                precio: '$ 2.800.000',
                duracion: '4 semanas',
                impacto: {habilitacion: 15, secop: 20, experiencia: 25, capacidad: 30}
            },
            {
                id: 'financiero',
                nombre: 'Mentoría Financiera para Licitar',
                tipo: 'Mentoría',
                desc: 'Cupo crédito, garantías y flujo.',
                nivel: 'En Desarrollo',
                tag: 'Financiero',
                precio: '$ 890.000',
                duracion: '2 sesiones',
                impacto: {habilitacion: 10, secop: 5, experiencia: 10, capacidad: 40}
            },
            {
                id: 'pliegos',
                nombre: 'Consultoría Pliegos y Objeciones',
                tipo: 'Consultoría',
                desc: 'Análisis pliegos complejos y subsanaciones.',
                nivel: 'Avanzado',
                tag: 'Avanzado',
                precio: '$ 1.600.000',
                duracion: 'Por proceso',
                impacto: {habilitacion: 10, secop: 30, experiencia: 30, capacidad: 15}
            },
            {
                id: 'alianzas',
                nombre: 'Mentoría Alianzas y Consorcios',
                tipo: 'Mentoría',
                desc: 'Uniones temporales y consorcios ganadores.',
                nivel: 'Avanzado',
                tag: 'Escala',
                precio: '$ 1.100.000',
                duracion: '2 sesiones',
                impacto: {habilitacion: 15, secop: 15, experiencia: 25, capacidad: 35}
            },
            {
                id: 'contenidos',
                nombre: 'Kit Contenidos IDEAPRO',
                tipo: 'Contenido',
                desc: '40 guías, plantillas y casos.',
                nivel: 'Todos',
                tag: 'Contenido',
                precio: '$ 180.000/año',
                duracion: 'On-demand',
                impacto: {habilitacion: 10, secop: 15, experiencia: 10, capacidad: 10}
            }
        ];
    }
    renderCatalog();
}

function renderCatalog() {
    const inp = el('filterSvc');
    const q = (inp && inp.value || '').toLowerCase();
    const grid = el('svcGrid');
    if (!grid) return;
    const filtered = servicios.filter(s => !q || s.nombre.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tipo.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q));
    grid.innerHTML = filtered.map(s => `
    <div class="svc">
      <div class="meta"><span>${s.tipo}</span><span>${s.nivel}</span></div>
      <h4>${s.nombre}</h4><p>${s.desc}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="tag">${s.tag}</span><span class="tag" style="background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0">${s.precio}</span></div>
      <div class="foot"><span>${s.duracion}</span><span style="font-family:'JetBrains Mono',monospace;font-size:.65rem">impacto H${s.impacto.habilitacion} S${s.impacto.secop}</span></div>
    </div>
  `).join('') || '<p style="color:#64748b">Sin resultados para filtro</p>';
}

window.addServicioDemo = function () {
    const nuevo = {
        id: 'demo' + Date.now(),
        nombre: 'Servicio Demo Nuevo',
        tipo: 'Mentoría',
        desc: 'Ejemplo de cómo el negocio agrega servicios sin tocar código. Edita data/servicios.json',
        nivel: 'Todos',
        tag: 'Demo',
        precio: '$ 0',
        duracion: '1h',
        impacto: {habilitacion: 10, secop: 10, experiencia: 10, capacidad: 10}
    };
    servicios.unshift(nuevo);
    renderCatalog();
    addMsg('Servicio demo agregado al catálogo vivo. Así escala IDEAPRO sin dev.', 'bot');
}
window.sendFreeText = sendFreeText;

// Init seguro
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadServicios();
        renderHistorial();
        updateEvoChart();
        const bar = el('progressBar');
        if (bar) bar.style.width = '0%';
        const hero = el('btnHero');
        if (hero) hero.onclick = (e) => {
            e.preventDefault();
            const ag = el('agente');
            if (ag) ag.scrollIntoView({behavior: 'smooth'});
        };
        const filt = el('filterSvc');
        if (filt) filt.addEventListener('input', renderCatalog);
        const free = el('freeInput');
        const btnEnviar = el('btnEnviar');
        if (free) {
            free.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (modoLibrePendiente) procesarModoLibre();
                    else sendFreeText();
                }
            });
        }
        if (btnEnviar) {
            btnEnviar.addEventListener('click', () => {
                if (modoLibrePendiente) procesarModoLibre();
                else sendFreeText();
            });
        }
    } catch (e) {
        console.error('init error', e);
    }
});
if (document.readyState !== 'loading') {
    try {
        loadServicios();
        renderHistorial();
        updateEvoChart();
    } catch (e) {
    }
}
