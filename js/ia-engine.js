;(function () {
    const DIMENSIONES = ["habilitacion", "secop", "experiencia", "capacidad"];

    function nlp(text) {
        const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const out = {sector: null, rup: null, secop: null, equipo: null, exp: null, objetivo: null, keywords: []};
        if (t.match(/tecnologia|software|digital|sistema|app|desarrollo|videojuego|juego/)) out.sector = "Tecnología";
        else if (t.match(/constru|obra|infra|ingenier|arquitect/)) out.sector = "Obra";
        else if (t.match(/consult|asesor|servicio|capacitacion|mentoria/)) out.sector = "Servicios";
        else if (t.match(/suministro|bienes|dotacion|mobiliario|alimento/)) out.sector = "Bienes";
        if (t.match(/rup/)) {
            if (t.match(/no tengo|vencido|sin rup|no.*rup/)) out.rup = "No";
            else if (t.match(/en tramite|tramite/)) out.rup = "Trámite";
            else if (t.match(/vigente|al dia|actualizado|si.*rup/)) out.rup = "Sí";
        } else {
            if (t.match(/sin rup|no tenemos rup|no tengo rup/)) out.rup = "No";
        }
        if (t.match(/secop/)) {
            if (t.match(/no conozco|nunca.*secop|nulo|no.*secop/)) out.secop = "Nulo";
            else if (t.match(/basico|entro y busco/)) out.secop = "Básico";
            else if (t.match(/intermedio|he ofertado/)) out.secop = "Intermedio";
            else if (t.match(/avanzado|gestiono todo/)) out.secop = "Avanzado";
        }
        if (t.match(/nunca.*particip|primera vez/)) out.exp = "Nunca";
        if (t.match(/1.*3|oferte|sin ganar/)) out.exp = "Ofertó";
        if (t.match(/gane|ganador|contrato.*ejecut/)) out.exp = "Ganador";
        if (t.match(/solo yo|nadie/)) out.equipo = "Nadie";
        if (t.match(/equipo|area|grupo/)) out.equipo = "Equipo";
        if (t.match(/primer contrato|empezar/)) out.objetivo = "Primer contrato";
        if (t.match(/escalar|crecer|aumentar/)) out.objetivo = "Escalar";
        if (t.match(/diversificar|otras entidades/)) out.objetivo = "Diversificar";
        return out;
    }

    function inferirDimensiones(r) {
        const d = {habilitacion: 0, secop: 0, experiencia: 0, capacidad: 0};
        let h = 0;
        if (r.rup === "Sí") h += 55; else if (r.rup === "Trámite") h += 30; else if (r.rup === "No") h += 8;
        else h += 15;
        if (r.sector && r.sector !== "Indefinido") h += 25; else h += 5;
        if (r.tam === "Mediana" || r.tam === "Grande") h += 20; else if (r.tam === "Pequeña") h += 12; else h += 5;
        d.habilitacion = Math.max(0, Math.min(100, h));
        let s = 0;
        if (r.secop === "Avanzado") s = 92; else if (r.secop === "Intermedio") s = 62; else if (r.secop === "Básico") s = 32; else s = 10;
        if (r.exp === "Ganador") s = Math.min(100, s + 12);
        d.secop = s;
        let e = 0;
        if (r.exp === "Ganador") e = 88; else if (r.exp === "Ofertó") e = 52; else if (r.exp === "Registrado") e = 26; else e = 7;
        d.experiencia = e;
        let c = 0;
        if (r.equipo === "Área") c = 90; else if (r.equipo === "Equipo") c = 68; else if (r.equipo === "Parcial") c = 34; else c = 12;
        if ((r.objetivo === "Escalar" || r.objetivo === "Diversificar") && c < 50) c -= 12;
        if (r.tam === "Micro" && c > 40) c -= 8;
        d.capacidad = Math.max(0, Math.min(100, c));
        return d;
    }

    function nivelDesdeScore(norm) {
        if (norm < 30) return {
            nivel: "EXPLORADOR",
            color: "#ef4444",
            desc: "Punto de partida. Te falta habilitación mínima."
        };
        if (norm < 56) return {
            nivel: "INICIADO",
            color: "#f59e0b",
            desc: "Ya rompiste inercia, pero te descalifican por forma."
        };
        if (norm < 81) return {
            nivel: "EN DESARROLLO",
            color: "#2563eb",
            desc: "Tienes tracción. Falta estrategia y sistematizar."
        };
        return {nivel: "AVANZADO", color: "#00c9a7", desc: "Madurez alta. Toca escalar ticket y alianzas."};
    }

    function generarInsight(respuestas, dims, norm, nivel) {
        const emp = respuestas.empresa || "Tu empresa";
        const sec = respuestas.sector || respuestas._inferSector || "tu sector";
        const sorted = Object.entries(dims).sort((a, b) => a[1] - b[1]);
        const debil = sorted[0][0], debilVal = sorted[0][1];
        const fuerte = sorted[sorted.length - 1][0], fuerteVal = sorted[sorted.length - 1][1];
        let analisis = "", causa = "", accion = "";
        const debMap = {
            habilitacion: "habilitación (RUP/oferta)",
            secop: "manejo SECOP II",
            experiencia: "experiencia ofertando",
            capacidad: "capacidad operativa"
        };
        const fuMap = {
            habilitacion: "base habilitante",
            secop: "dominio SECOP",
            experiencia: "historial contratación",
            capacidad: "equipo"
        };
        if (nivel === "EXPLORADOR") {
            analisis = `${emp} en ${sec} está en fase exploratoria. Con ${norm}/100 hoy perderías por requisitos, no por precio ni calidad.`;
            causa = `Cuello de botella: <strong>${debMap[debil]} (${debilVal}%)</strong>. Sin cerrar eso, cada oferta es lotería.`;
            accion = `Ataca ${debMap[debil]} en 15 días. Tu fortaleza relativa es ${fuMap[fuerte]} (${fuerteVal}%), úsala como palanca.`;
        } else if (nivel === "INICIADO") {
            analisis = `${emp} ya dio el primer paso en ${sec}. Entiendes SECOP básico pero te falta lectura fina de pliegos.`;
            causa = `Brecha crítica: ${debMap[debil]} (${debilVal}%). Te descalifican por forma, no por fondo.`;
            accion = `Siguiente hito: llevar ${debMap[debil]} a 60% en 30 días. Con ${fuMap[fuerte]} ya sólido, puedes ofertar acompañado.`;
        } else if (nivel === "EN DESARROLLO") {
            analisis = `${emp} tiene tracción en ${sec}. Ofertas, pero sin priorización de entidades ni pipeline.`;
            causa = `Debes sistematizar ${debMap[debil]} (${debilVal}%). El equipo está en ${dims.capacidad}%, no da para escalar sin proceso.`;
            accion = `Foco 90 días: estrategia comercial + simulador. Sube ${debMap[debil]} y tu tasa de adjudicación puede duplicarse.`;
        } else {
            analisis = `${emp} es proveedor maduro. Tu reto no es entrar, es ticket promedio y recurrencia.`;
            causa = `Oportunidad: ${fuMap[fuerte]} (${fuerteVal}%) sólido. El salto está en llevar ${debMap[debil]} de ${debilVal}% a 75%+.`;
            accion = `Estrategia avanzada: consorcios para mayor cuantía y defensa técnica de pliegos.`;
        }
        let objTxt = "";
        if (respuestas.objetivo === "Primer contrato" && dims.experiencia < 30) objTxt = `Objetivo "primer contrato" coherente, pero sin RUP vigente es imposible. RUP primero, luego SECOP.`;
        else if (respuestas.objetivo === "Escalar" && dims.capacidad < 45) objTxt = `Quieres escalar con capacidad ${dims.capacidad}%. Vas a colapsar. Proceso o aliado primero.`;
        else if (respuestas.objetivo === "Estructurar") objTxt = `Estructurar área es el mejor ROI: -40% reproceso en pliegos.`;
        else objTxt = `Objetivo "${respuestas.objetivo}" alineado con nivel ${nivel}. Ruta lo respeta.`;
        return {analisis, causa, accion, objTxt, debil, fuerte, debilVal, fuerteVal, debMap, fuMap};
    }

    function recomendar(servicios, respuestas, dims, nivel) {
        const debil = Object.entries(dims).sort((a, b) => a[1] - b[1])[0][0];
        let scored = servicios.map(s => {
            let sc = (s.impacto[debil] || 0) * 1.5 + (s.impacto[Object.entries(dims).sort((a, b) => a[1] - b[1])[1][0]] || 0) * 0.5;
            if (s.nivel === nivel) sc += 10;
            if (s.nivel === "Todos") sc += 5;
            if (dims[debil] > 70 && s.impacto[debil] < 20) sc -= 15;
            return {...s, _sc: sc};
        }).sort((a, b) => b._sc - a._sc);
        if (respuestas.rup === "No" && nivel === "EXPLORADOR") scored = [servicios.find(s => s.id === "rup"), ...scored.filter(s => s.id !== "rup")];
        if (dims.secop < 25) scored = [servicios.find(s => s.id === "secop-bas"), ...scored.filter(s => s.id !== "secop-bas")];
        const main = scored[0];
        const cross = scored.filter(s => s.id !== main.id).slice(0, 2);
        return {main, cross, debil};
    }

    window.IAEngine = {DIMENSIONES, nlp, inferirDimensiones, nivelDesdeScore, generarInsight, recomendar};
})();
