import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── CRITERIOS REPIC v3.1 (con cuadrante de decisiones y criterios avanzados) ───
const CRITERIOS = [
  { id: 1, nombre: "Análisis pre-visita", peso: 0.05, descripcion: "Investigación previa del propietario y la zona", queEvaluar: "¿El captador menciona haber investigado al propietario, la zona, precios de referencia, personalidad del cliente o estrategia de precio ANTES de llegar? ¿Grabó un análisis previo?" },
  { id: 2, nombre: "Conexión y confianza", peso: 0.08, descripcion: "Rapport inicial, empatía, uso del nombre", queEvaluar: "¿Se percibe rapport? ¿Usó el nombre del propietario, mostró interés genuino, hizo comentarios empáticos? ¿Preguntó por su situación personal?" },
  { id: 3, nombre: "Escucha activa", peso: 0.08, descripcion: "Parafraseo, preguntas de profundización", queEvaluar: "¿Parafraseó lo que dijo el propietario? ¿Hizo preguntas como '¿a qué se refiere con...?' o '¿me puede contar más?'" },
  { id: 4, nombre: "Resumen de confirmación", peso: 0.12, descripcion: "Validar entendimiento con el propietario", queEvaluar: "¿Hizo un resumen tipo 'Déjame ver si entendí: usted quiere vender porque..., el precio que tiene en mente es..., y necesita...'? Esto es CRÍTICO, tiene peso del 12%." },
  { id: 5, nombre: "Tomador de decisión", peso: 0.10, descripcion: "Identificar quién decide la venta/renta", queEvaluar: "¿Preguntó quién toma la decisión? ¿Identificó copropietarios, cónyuge, herencia compartida? ¿Verificó si hay juicio sucesorio o situación legal?" },
  { id: 6, nombre: "Evaluación física", peso: 0.08, descripcion: "Revisión detallada del inmueble", queEvaluar: "¿Mencionó metros cuadrados, recámaras, estado de construcción, mejoras necesarias (pintura, impermeabilizante, fachada)? ¿Tomó medidas o hizo observaciones técnicas?" },
  { id: 7, nombre: "Educación valor avalúo", peso: 0.08, descripcion: "Explicar proceso de valuación con datos", queEvaluar: "¿Explicó cómo se calcula el valor? Ejemplo: 'm2 x precio/m2 + terreno'. ¿Educó sobre riesgo de sobrevalorar? ¿Mencionó que el avaluador cobra ajuste por falsear información?" },
  { id: 8, nombre: "Propuesta desglosada", peso: 0.10, descripcion: "Presentar servicios con transparencia total", queEvaluar: "¿Presentó propuesta clara: precio neto para el dueño + honorarios + precio de oferta? ¿Fue transparente con comisiones y tiempos? Ejemplo: '$850k para ti + 5% = ofertar en $899k'" },
  { id: 9, nombre: "Paquetes de servicio", peso: 0.05, descripcion: "Opciones diferenciadas (5%, 6%, 7%)", queEvaluar: "¿Ofreció diferentes paquetes (básico 5%, estándar 6%, premium 7%)? ¿Explicó qué incluye cada uno? Si no había financiamiento, ¿al menos mencionó las opciones?" },
  { id: 10, nombre: "Manejo de objeciones", peso: 0.08, descripcion: "Responder dudas con datos, no con presión", queEvaluar: "¿Respondió objeciones con datos y seguridad? ¿Manejó temas de comisión, exclusividad, tiempo de venta? ¿Educó en vez de presionar?" },
  { id: 11, nombre: "Pregunta de cierre", peso: 0.05, descripcion: "Solicitar el compromiso directamente", queEvaluar: "¿Pidió el compromiso: '¿Procedemos con la exclusiva?', '¿Firmamos hoy?', '¿Cuándo empezamos?'? O si decidió NO captar, ¿lo comunicó con claridad y profesionalismo?" },
  { id: 12, nombre: "Documentación en campo", peso: 0.05, descripcion: "Fotos, datos, firma, mediciones in situ", queEvaluar: "¿Tomó fotos, midió la propiedad, recopiló documentos, pidió certificado de libertad de gravamen? ¿Verificó escrituras o situación legal en campo?" },
  { id: 13, nombre: "Análisis post-visita", peso: 0.05, descripcion: "Reflexión grabada y plan de seguimiento", queEvaluar: "¿Grabó o documentó una conclusión con su razonamiento? ¿Aplicó el CUADRANTE DE DECISIONES (precio vs avalúo + riesgo jurídico + disposición ganar-ganar + si Inmobili es 1era opción)? ¿Definió siguiente paso?" },
];

const META = 4.0;

// Inteligencia comercial - Rangos de precio vendibles por ciudad
const INTEL_PRECIOS = {
  "Gómez Palacio": { rangoFuerte: "$520k - $790k", zonasFuertes: "Fidel Velázquez, San Antonio, Santa Teresa, Haciendas del Refugio" },
  "Torreón": { rangoFuerte: "$520k - $790k", zonasFuertes: "La Paz, Campo Nuevo, Monterreal" },
  "Lerdo": { rangoFuerte: "$400k - $650k", zonasFuertes: "Las Margaritas, Las Américas, San Lorenzo" },
};

const SK_CAP = "repic-captadores";
const SK_HIST = "repic-historial";

// ─── COLORES INMOBILI INTERNACIONAL ───
const CO = {
  bg: "#1A1A1A",
  surface: "#242424",
  surfaceLight: "#2E2E2E",
  border: "#3D3D3D",
  gold: "#C49A2A",
  goldLight: "#D4AA3A",
  goldDark: "#A47E1E",
  goldDim: "#8B6914",
  success: "#0F6E56",
  successLight: "#15926F",
  danger: "#C0392B",
  dangerLight: "#E74C3C",
  warning: "#D4AA3A",
  text: "#F5F0E8",
  textDim: "#B8AFA2",
  textMuted: "#7A7268",
  white: "#FFFFFF",
};

function calcPond(cals) { let s = 0; CRITERIOS.forEach((c) => { s += (cals[c.id] || 0) * c.peso; }); return Math.round(s * 100) / 100; }
function colorNota(n) { if (n >= 4.5) return CO.success; if (n >= META) return CO.gold; if (n >= 3.0) return CO.warning; return CO.danger; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmtFecha(ts) { return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
function ini(n) { return n.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2); }

const SEED_CAP = [];

function genDemo(caps) {
  const h = {};
  caps.forEach((cap) => {
    const ev = [];
    for (let i = 5; i >= 0; i--) {
      const cals = {}, justs = {};
      CRITERIOS.forEach((c) => { cals[c.id] = Math.min(5, Math.max(1, Math.round((3 + Math.random() * 2 + (5 - i) * 0.15) * 10) / 10)); justs[c.id] = "Evaluación demo"; });
      ev.push({ id: genId(), fecha: Date.now() - i * 7 * 86400000, calificaciones: cals, justificaciones: justs, ponderado: calcPond(cals), propiedad: `Propiedad ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 999)}` });
    }
    h[cap.id] = ev;
  });
  return h;
}

function usePersist(key, init) {
  const [data, setData] = useState(() => { try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch {} return init; });
  const setP = useCallback((u) => { setData((prev) => { const next = typeof u === "function" ? u(prev) : u; try { localStorage.setItem(key, JSON.stringify(next)); } catch {} return next; }); }, [key]);
  return [data, setP];
}

// ─── AI EVALUATION (via Netlify Function - API key segura en servidor) ───
async function evaluarConIA(transcripcion) {
  const response = await fetch("/.netlify/functions/evaluar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcripcion }),
  });

  const text = await response.text();

  if (!response.ok) {
    let msg = "Error " + response.status;
    try { const j = JSON.parse(text); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }

  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Respuesta no-JSON:", text.substring(0, 200));
    throw new Error("La IA no devolvió JSON válido. Intenta de nuevo.");
  }
}

// ─── UI COMPONENTS ───
const iS = { width: "100%", padding: "12px 16px", background: CO.surfaceLight, border: `1px solid ${CO.border}`, borderRadius: 10, color: CO.text, fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" };

function Bar({ value, max = 5, color, w = 60 }) {
  return <div style={{ width: w, height: 6, background: CO.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || colorNota(value), borderRadius: 3, transition: "width 0.5s" }} /></div>;
}

function Badge({ children, color }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: `${color}22`, color, border: `1px solid ${color}44` }}>{children}</span>;
}

function Spark({ data, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data) - 0.5, mx = Math.max(...data) + 0.5, rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / rng) * height}`).join(" ");
  const col = colorNota(data[data.length - 1]);
  const gid = `s${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.3" /><stop offset="100%" stopColor={col} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => { const x = (i / (data.length - 1)) * width, y = height - ((v - mn) / rng) * height; return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5} fill={i === data.length - 1 ? col : CO.surfaceLight} stroke={col} strokeWidth={1.5} />; })}
    </svg>
  );
}

function Av({ nombre, size = 36, color }) {
  const cl = color || CO.gold;
  return <div style={{ width: size, height: size, borderRadius: 10, background: `linear-gradient(135deg, ${cl}44, ${cl}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: cl, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>{ini(nombre)}</div>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 480, background: CO.surface, borderRadius: "20px 20px 0 0", padding: "24px 20px max(20px, env(safe-area-inset-bottom))", maxHeight: "85vh", overflow: "auto", animation: "slideUp 0.3s ease" }}>
        <div style={{ width: 40, height: 4, background: CO.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: CO.text, margin: "0 0 16px", fontFamily: "'DM Sans',sans-serif" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled, color, style: s }) {
  const bg = color || CO.gold;
  return <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px", background: disabled ? CO.border : `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: disabled ? CO.textMuted : CO.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", ...s }}>{children}</button>;
}

function Lbl({ children }) { return <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CO.textDim, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{children}</label>; }

// ─── HEADER con logo real ───
function Header() {
  return (
    <header style={{ padding: "16px 20px 14px", background: CO.bg, borderBottom: `1px solid ${CO.gold}33` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logo-ii.png" alt="II" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: CO.gold, fontFamily: "'DM Sans',sans-serif", letterSpacing: 1 }}>REPIC</h1>
          <p style={{ margin: 0, fontSize: 10, color: CO.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Inmobili Internacional</p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <span style={{ fontSize: 9, color: CO.textMuted, letterSpacing: 0.5 }}>v3.1</span>
        </div>
      </div>
    </header>
  );
}

function Nav({ vista, setVista }) {
  const items = [{ key: "evaluar", icon: "📋", label: "Evaluar" }, { key: "dashboard", icon: "📊", label: "Dashboard" }, { key: "historial", icon: "📁", label: "Historial" }, { key: "equipo", icon: "👥", label: "Equipo" }];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: CO.bg, borderTop: `1px solid ${CO.gold}33`, display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 100 }}>
      {items.map((it) => (
        <button key={it.key} onClick={() => setVista(it.key)} style={{ background: "none", border: "none", color: vista === it.key ? CO.gold : CO.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: "4px 12px" }}>
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ═══ CUADRANTE DE DECISIONES WIDGET ═══
function CuadranteWidget({ cuadrante }) {
  if (!cuadrante) return null;
  const items = [
    { label: "Precio vs Avalúo", val: cuadrante.precioAvaluo },
    { label: "Riesgo Jurídico", val: cuadrante.riesgoJuridico },
    { label: "Ganar-Ganar", val: cuadrante.ganarGanar },
    { label: "1era Opción", val: cuadrante.primeraOpcion },
  ];
  const decColor = cuadrante.decision === "CAPTAR" ? CO.success : cuadrante.decision === "NO CAPTAR" ? CO.danger : CO.warning;
  return (
    <div style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${CO.gold}33` }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: CO.gold, margin: "0 0 12px", letterSpacing: 0.5, textTransform: "uppercase" }}>⬛ Cuadrante de Decisiones</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {items.map((it, i) => {
          const c = it.val === "ok" ? CO.success : it.val === "riesgo" ? CO.danger : CO.textMuted;
          return (
            <div key={i} style={{ background: `${c}11`, border: `1px solid ${c}33`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: CO.textDim, marginBottom: 2 }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: c, textTransform: "uppercase" }}>{it.val === "ok" ? "✓ OK" : it.val === "riesgo" ? "✗ RIESGO" : "— N/A"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: `${decColor}15`, border: `2px solid ${decColor}`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: decColor, fontFamily: "'DM Sans',sans-serif" }}>{cuadrante.decision}</div>
        <div style={{ fontSize: 12, color: CO.textDim, marginTop: 4 }}>{cuadrante.razon}</div>
      </div>
    </div>
  );
}

// ═══ VISTA EQUIPO ═══
function VistaEquipo({ captadores, setCaptadores }) {
  const [mo, setMo] = useState(false);
  const [ed, setEd] = useState(null);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [cd, setCd] = useState(null);
  const act = captadores.filter((c) => c.activo), inact = captadores.filter((c) => !c.activo);
  const abN = () => { setEd(null); setNom(""); setTel(""); setMo(true); };
  const abE = (c) => { setEd(c); setNom(c.nombre); setTel(c.telefono || ""); setMo(true); };
  const save = () => { if (!nom.trim()) return; if (ed) setCaptadores((p) => p.map((c) => c.id === ed.id ? { ...c, nombre: nom.trim(), telefono: tel.trim() } : c)); else setCaptadores((p) => [...p, { id: genId(), nombre: nom.trim(), telefono: tel.trim(), activo: true, fechaAlta: Date.now() }]); setMo(false); };
  const tog = (id) => { setCaptadores((p) => p.map((c) => c.id === id ? { ...c, activo: !c.activo } : c)); setCd(null); };

  return (
    <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 800, color: CO.text, margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif" }}>Equipo</h2><p style={{ color: CO.textMuted, fontSize: 13, margin: 0 }}>{act.length} captadores activos</p></div>
        <button onClick={abN} style={{ padding: "10px 18px", background: `linear-gradient(135deg, ${CO.gold}, ${CO.goldDark})`, color: CO.bg, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nuevo</button>
      </div>
      {act.map((c) => (
        <div key={c.id} style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${CO.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Av nombre={c.nombre} color={CO.success} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: CO.text }}>{c.nombre}</div><div style={{ fontSize: 12, color: CO.textMuted, marginTop: 2 }}>{c.telefono || "Sin tel"} · {fmtFecha(c.fechaAlta)}</div></div>
          <button onClick={() => abE(c)} style={{ width: 34, height: 34, borderRadius: 8, background: CO.surface, border: `1px solid ${CO.border}`, cursor: "pointer", fontSize: 14 }}>✏️</button>
          <button onClick={() => setCd(c.id)} style={{ width: 34, height: 34, borderRadius: 8, background: CO.surface, border: `1px solid ${CO.border}`, cursor: "pointer", fontSize: 14 }}>⏸</button>
        </div>
      ))}
      {cd && <div style={{ background: `${CO.danger}11`, border: `1px solid ${CO.danger}33`, borderRadius: 12, padding: 14, marginBottom: 12 }}><p style={{ fontSize: 14, color: CO.text, marginBottom: 10 }}>¿Desactivar a <strong>{captadores.find((c) => c.id === cd)?.nombre}</strong>?</p><div style={{ display: "flex", gap: 8 }}><button onClick={() => tog(cd)} style={{ flex: 1, padding: 10, background: CO.danger, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Sí</button><button onClick={() => setCd(null)} style={{ flex: 1, padding: 10, background: CO.surface, color: CO.textDim, border: `1px solid ${CO.border}`, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>No</button></div></div>}
      {inact.length > 0 && <><h3 style={{ fontSize: 12, fontWeight: 700, color: CO.textMuted, margin: "20px 0 10px", textTransform: "uppercase" }}>Inactivos</h3>{inact.map((c) => (<div key={c.id} style={{ background: CO.surface, borderRadius: 14, padding: 14, marginBottom: 8, border: `1px solid ${CO.border}`, display: "flex", alignItems: "center", gap: 12, opacity: 0.5 }}><Av nombre={c.nombre} size={32} color={CO.textMuted} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, color: CO.textDim }}>{c.nombre}</div></div><button onClick={() => tog(c.id)} style={{ padding: "6px 12px", borderRadius: 8, background: `${CO.success}22`, border: `1px solid ${CO.success}44`, color: CO.success, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Reactivar</button></div>))}</>}
      <Modal open={mo} onClose={() => setMo(false)} title={ed ? "Editar Captador" : "Nuevo Captador"}>
        <div style={{ marginBottom: 16 }}><Lbl>Nombre completo *</Lbl><input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ej: Roberto García López" style={iS} autoFocus /></div>
        <div style={{ marginBottom: 20 }}><Lbl>Teléfono</Lbl><input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Ej: 871-555-1234" type="tel" style={iS} /></div>
        <Btn onClick={save} disabled={!nom.trim()}>{ed ? "Guardar" : "Dar de Alta"} ✓</Btn>
      </Modal>
    </div>
  );
}

// ═══ VISTA EVALUAR (IA + Cuadrante) ═══
function VistaEvaluar({ captadores, historial, setHistorial }) {
  const [cap, setCap] = useState(""); const [prop, setProp] = useState(""); const [ciudad, setCiudad] = useState("Gómez Palacio");
  const [grab, setGrab] = useState(false); const [trans, setTrans] = useState("");
  const [paso, setPaso] = useState(1); const [res, setRes] = useState(null);
  const [evaluando, setEvaluando] = useState(false); const [error, setError] = useState("");
  const [iaRes, setIaRes] = useState(null);
  const recRef = useRef(null);
  const act = captadores.filter((c) => c.activo);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Usa Chrome para grabar voz."); return; }
    const r = new SR(); r.lang = "es-MX"; r.continuous = true; r.interimResults = true;
    let fin = trans;
    r.onresult = (e) => { let i2 = ""; for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript + " "; else i2 += e.results[i][0].transcript; } setTrans(fin + i2); };
    r.onerror = () => setGrab(false); r.onend = () => { setTrans(fin); setGrab(false); };
    recRef.current = r; r.start(); setGrab(true);
  };
  const stopRec = () => { recRef.current?.stop(); setGrab(false); };

  const enviar = async () => {
    if (trans.trim().split(/\s+/).length < 10) { setError("Transcripción muy corta. Necesitas al menos unas oraciones para que la IA evalúe."); return; }
    setEvaluando(true); setError("");
    try {
      const r = await evaluarConIA(trans);
      const cals = {}, justs = {};
      r.evaluaciones.forEach((e) => { cals[e.id] = e.cal; justs[e.id] = e.just; });
      setIaRes({ calificaciones: cals, justificaciones: justs, cuadrante: r.cuadrante || null });
      setPaso(3);
    } catch (err) { console.error(err); setError(err.message || "Error al evaluar. Verifica tu conexión."); }
    setEvaluando(false);
  };

  const guardar = () => {
    if (!iaRes) return;
    const pond = calcPond(iaRes.calificaciones);
    const ev = { id: genId(), fecha: Date.now(), calificaciones: iaRes.calificaciones, justificaciones: iaRes.justificaciones, cuadrante: iaRes.cuadrante, ponderado: pond, propiedad: prop, ciudad, transcripcion: trans };
    setHistorial((p) => ({ ...p, [cap]: [...(p[cap] || []), ev] }));
    setRes(ev); setPaso(4);
  };

  const reset = () => { setCap(""); setProp(""); setTrans(""); setRes(null); setIaRes(null); setError(""); setPaso(1); };

  const intel = INTEL_PRECIOS[ciudad];

  if (paso === 1) return (
    <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: CO.gold, margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif" }}>Nueva Evaluación</h2>
      <p style={{ color: CO.textMuted, fontSize: 13, margin: "0 0 6px" }}>La IA evalúa tu visita + Cuadrante de Decisiones</p>
      <div style={{ background: `${CO.gold}11`, border: `1px solid ${CO.gold}33`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: CO.gold, margin: 0, lineHeight: 1.5 }}>🤖 Graba tu visita → la IA califica 13 criterios REPIC + aplica el Cuadrante de Decisiones automáticamente.</p>
      </div>
      <div style={{ marginBottom: 16 }}><Lbl>Captador</Lbl><select value={cap} onChange={(e) => setCap(e.target.value)} style={{ ...iS, appearance: "none", cursor: "pointer" }}><option value="">Seleccionar...</option>{act.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
      <div style={{ marginBottom: 16 }}><Lbl>Propiedad</Lbl><input value={prop} onChange={(e) => setProp(e.target.value)} placeholder="Ej: Casa Col. Campestre #42" style={iS} /></div>
      <div style={{ marginBottom: 16 }}><Lbl>Ciudad</Lbl><select value={ciudad} onChange={(e) => setCiudad(e.target.value)} style={{ ...iS, appearance: "none", cursor: "pointer" }}><option>Gómez Palacio</option><option>Torreón</option><option>Lerdo</option></select></div>
      {intel && <div style={{ background: CO.surfaceLight, borderRadius: 10, padding: 12, marginBottom: 20, border: `1px solid ${CO.border}` }}><p style={{ fontSize: 12, color: CO.gold, margin: "0 0 4px", fontWeight: 700 }}>📊 Intel comercial — {ciudad}</p><p style={{ fontSize: 12, color: CO.textDim, margin: 0 }}>Rango fuerte: {intel.rangoFuerte}</p><p style={{ fontSize: 12, color: CO.textDim, margin: 0 }}>Zonas: {intel.zonasFuertes}</p></div>}
      <Btn onClick={() => setPaso(2)} disabled={!cap || !prop}>Continuar →</Btn>
    </div>
  );

  if (paso === 2) return (
    <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <button onClick={() => setPaso(1)} style={{ background: "none", border: "none", color: CO.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>← Regresar</button>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: CO.gold, margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif" }}>Grabar Visita</h2>
      <p style={{ color: CO.textMuted, fontSize: 13, margin: "0 0 24px" }}>Graba toda la conversación de la visita</p>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button onClick={grab ? stopRec : startRec} disabled={evaluando} style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${grab ? CO.danger : CO.gold}`, background: grab ? `${CO.danger}22` : `${CO.gold}11`, cursor: evaluando ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto", animation: grab ? "pulse 1.5s infinite" : "none" }}>{grab ? "⏹" : "🎙"}</button>
        <p style={{ color: grab ? CO.danger : CO.textMuted, fontSize: 12, marginTop: 8, fontWeight: 600 }}>{grab ? "Grabando..." : "Toca para grabar"}</p>
      </div>
      <textarea value={trans} onChange={(e) => setTrans(e.target.value)} disabled={evaluando} placeholder="La transcripción aparece aquí, o escribe las notas manualmente..." rows={8} style={{ ...iS, resize: "vertical", minHeight: 140, lineHeight: 1.6, opacity: evaluando ? 0.5 : 1 }} />
      {trans.trim() && <p style={{ fontSize: 12, color: CO.textMuted, marginTop: 6 }}>{trans.trim().split(/\s+/).length} palabras</p>}
      {error && <div style={{ background: `${CO.danger}11`, border: `1px solid ${CO.danger}33`, borderRadius: 10, padding: 12, marginTop: 12 }}><p style={{ fontSize: 13, color: CO.danger, margin: 0 }}>{error}</p></div>}
      <div style={{ marginTop: 20 }}>
        <Btn onClick={enviar} disabled={!trans.trim() || evaluando}>
          {evaluando ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${CO.bg}44`, borderTopColor: CO.bg, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Analizando con IA...</span> : "🤖 Evaluar con IA →"}
        </Btn>
      </div>
    </div>
  );

  if (paso === 3 && iaRes) {
    const pond = calcPond(iaRes.calificaciones);
    return (
      <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
        <button onClick={() => setPaso(2)} style={{ background: "none", border: "none", color: CO.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>← Regresar</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><h2 style={{ fontSize: 22, fontWeight: 800, color: CO.gold, margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif" }}>Scorecard IA</h2><p style={{ color: CO.textMuted, fontSize: 13, margin: 0 }}>REPIC v3.1</p></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 28, fontWeight: 800, color: colorNota(pond), fontFamily: "'DM Sans',sans-serif" }}>{pond.toFixed(2)}</div><Badge color={pond >= META ? CO.success : CO.danger}>{pond >= META ? "✓ PASA" : "✗ NO PASA"}</Badge></div>
        </div>
        <Bar value={pond} w="100%" />
        <CuadranteWidget cuadrante={iaRes.cuadrante} />
        <div style={{ marginTop: 8 }}>
          {CRITERIOS.map((cr) => {
            const cal = iaRes.calificaciones[cr.id] || 0, just = iaRes.justificaciones[cr.id] || "";
            return (
              <div key={cr.id} style={{ padding: "12px 0", borderBottom: `1px solid ${CO.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 700, color: CO.text }}>{cr.id}. {cr.nombre}</span> <span style={{ fontSize: 10, color: CO.textMuted }}>{(cr.peso * 100).toFixed(0)}%</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Bar value={cal} w={45} /><span style={{ fontSize: 16, fontWeight: 800, color: colorNota(cal), width: 22, textAlign: "right" }}>{cal}</span></div>
                </div>
                <p style={{ fontSize: 11, color: CO.textDim, margin: 0, lineHeight: 1.4 }}>💬 {just}</p>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20 }}><Btn onClick={guardar} color={CO.success}>Guardar Evaluación ✓</Btn></div>
      </div>
    );
  }

  if (paso === 4 && res) {
    const cn = captadores.find((c) => c.id === cap)?.nombre || cap;
    const top3 = CRITERIOS.map((c) => ({ ...c, cal: res.calificaciones[c.id] || 0, just: res.justificaciones?.[c.id] || "" })).sort((a, b) => a.cal - b.cal).slice(0, 3);
    const decTxt = res.cuadrante ? `\n\n⬛ Cuadrante: ${res.cuadrante.decision} — ${res.cuadrante.razon}` : "";
    return (
      <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
        <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{res.ponderado >= META ? "🏆" : "📈"}</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: colorNota(res.ponderado), fontFamily: "'DM Sans',sans-serif" }}>{res.ponderado.toFixed(2)}</div>
          <Badge color={res.ponderado >= META ? CO.success : CO.danger}>{res.ponderado >= META ? "APROBADO — Fase de Liderazgo" : "REQUIERE MEJORA"}</Badge>
          <p style={{ color: CO.textDim, fontSize: 13, marginTop: 12 }}>{cn} · {res.propiedad}</p>
          <p style={{ color: CO.textMuted, fontSize: 11, marginTop: 4 }}>🤖 Evaluado por IA · REPIC v3.1</p>
        </div>
        <CuadranteWidget cuadrante={res.cuadrante} />
        <div style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${CO.border}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: CO.gold, margin: "0 0 12px", letterSpacing: 0.5, textTransform: "uppercase" }}>Áreas de mejora</h3>
          {top3.map((it) => (<div key={it.id} style={{ padding: "8px 0", borderBottom: `1px solid ${CO.border}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: CO.text }}>{it.nombre}</span><span style={{ fontSize: 14, fontWeight: 800, color: colorNota(it.cal) }}>{it.cal}</span></div>{it.just && <p style={{ fontSize: 11, color: CO.textMuted, margin: "3px 0 0" }}>💬 {it.just}</p>}</div>))}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button onClick={() => { const t = `*REPIC v3.1 — Inmobili Internacional*%0A%0ACaptador: ${cn}%0APropiedad: ${res.propiedad} (${res.ciudad || ""})%0AScore: *${res.ponderado.toFixed(2)}/5.00*%0AEstatus: ${res.ponderado >= META ? "✅ APROBADO" : "⚠️ REQUIERE MEJORA"}${res.cuadrante ? `%0A%0A⬛ Cuadrante: ${res.cuadrante.decision}%0A${res.cuadrante.razon}` : ""}%0A%0A_Áreas de mejora:_%0A${top3.map((x) => `• ${x.nombre}: ${x.cal}/5`).join("%0A")}`; window.open(`https://wa.me/?text=${t}`, "_blank"); }}
            style={{ flex: 1, padding: 12, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>WhatsApp 📤</button>
          <button onClick={() => { const s = `REPIC - ${cn} - ${res.ponderado.toFixed(2)}`; const b = `REPIC v3.1 - Inmobili Internacional\n\nCaptador: ${cn}\nPropiedad: ${res.propiedad}\nScore: ${res.ponderado.toFixed(2)}/5.00${decTxt}\n\nÁreas de mejora:\n${top3.map((x) => `- ${x.nombre}: ${x.cal}/5 — ${x.just}`).join("\n")}`; window.open(`mailto:?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`, "_blank"); }}
            style={{ flex: 1, padding: 12, background: CO.surfaceLight, color: CO.text, border: `1px solid ${CO.border}`, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Correo ✉️</button>
        </div>
        <Btn onClick={reset}>Nueva Evaluación</Btn>
      </div>
    );
  }
  return null;
}

// ═══ VISTA DASHBOARD ═══
function VistaDash({ captadores, historial }) {
  const resumen = useMemo(() => {
    return captadores.filter((c) => c.activo).map((cap) => {
      const ev = historial[cap.id] || [], ult = ev.slice(-6), ponds = ult.map((e) => e.ponderado);
      const ultimo = ponds[ponds.length - 1] || 0, prom = ponds.length ? ponds.reduce((a, b) => a + b, 0) / ponds.length : 0;
      const tend = ponds.length >= 2 ? ponds[ponds.length - 1] - ponds[ponds.length - 2] : 0;
      const cp = {}; CRITERIOS.forEach((c) => { const v = ult.map((e) => e.calificaciones[c.id] || 0).filter(Boolean); cp[c.id] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; });
      return { ...cap, totalEvals: ev.length, ultimo, promedio: Math.round(prom * 100) / 100, tendencia: tend, ponderados: ponds, critPromedios: cp, pasaMeta: ultimo >= META };
    }).sort((a, b) => b.ultimo - a.ultimo);
  }, [captadores, historial]);
  const eqP = resumen.length ? resumen.reduce((a, c) => a + c.promedio, 0) / resumen.length : 0;
  const pasan = resumen.filter((c) => c.pasaMeta).length;

  return (
    <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: CO.gold, margin: "0 0 20px", fontFamily: "'DM Sans',sans-serif" }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[{ l: "Equipo", v: eqP.toFixed(2), c: colorNota(eqP) }, { l: "Pasan meta", v: `${pasan}/${resumen.length}`, c: pasan > 0 ? CO.success : CO.danger }, { l: "Evaluaciones", v: resumen.reduce((a, c) => a + c.totalEvals, 0), c: CO.gold }].map((k, i) => (
          <div key={i} style={{ background: CO.surfaceLight, borderRadius: 14, padding: "14px 12px", border: `1px solid ${CO.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.c, fontFamily: "'DM Sans',sans-serif" }}>{k.v}</div>
            <div style={{ fontSize: 10, color: CO.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>
      {resumen.map((cap) => (
        <div key={cap.id} style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${cap.pasaMeta ? `${CO.success}33` : CO.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Av nombre={cap.nombre} color={colorNota(cap.ultimo)} />
              <div><div style={{ fontSize: 15, fontWeight: 700, color: CO.text }}>{cap.nombre}</div><div style={{ fontSize: 12, color: CO.textMuted }}>{cap.totalEvals} evals</div></div>
            </div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 900, color: colorNota(cap.ultimo) }}>{cap.ultimo.toFixed(2)}</div><div style={{ fontSize: 11, color: cap.tendencia >= 0 ? CO.success : CO.danger, fontWeight: 600 }}>{cap.tendencia >= 0 ? "▲" : "▼"} {Math.abs(cap.tendencia).toFixed(2)}</div></div>
          </div>
          <Spark data={cap.ponderados} width={280} height={32} />
        </div>
      ))}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: CO.gold, margin: "20px 0 12px", letterSpacing: 0.5, textTransform: "uppercase" }}>Criterios del equipo</h3>
      <div style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, border: `1px solid ${CO.border}` }}>
        {CRITERIOS.map((cr) => { const p = resumen.length ? resumen.reduce((a, c) => a + (c.critPromedios[cr.id] || 0), 0) / resumen.length : 0; return (<div key={cr.id} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: CO.textDim }}>{cr.nombre}</span><span style={{ fontSize: 12, fontWeight: 700, color: colorNota(p) }}>{p.toFixed(1)}</span></div><Bar value={p} w="100%" /></div>); })}
      </div>
    </div>
  );
}

// ═══ VISTA HISTORIAL ═══
function VistaHist({ captadores, historial }) {
  const [filtro, setFiltro] = useState("");
  const [det, setDet] = useState(null);
  const act = captadores.filter((c) => c.activo);
  const all = useMemo(() => { const a = []; Object.entries(historial).forEach(([cid, evs]) => { const cap = captadores.find((c) => c.id === cid); evs.forEach((ev) => a.push({ ...ev, captadorId: cid, captadorNombre: cap?.nombre || cid })); }); return a.sort((a, b) => b.fecha - a.fecha); }, [captadores, historial]);
  const filt = filtro ? all.filter((e) => e.captadorId === filtro) : all;

  return (
    <div style={{ padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: CO.gold, margin: "0 0 16px", fontFamily: "'DM Sans',sans-serif" }}>Historial</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button onClick={() => setFiltro("")} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${!filtro ? CO.gold : CO.border}`, background: !filtro ? `${CO.gold}22` : "transparent", color: !filtro ? CO.gold : CO.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Todos</button>
        {act.map((c) => <button key={c.id} onClick={() => setFiltro(c.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filtro === c.id ? CO.gold : CO.border}`, background: filtro === c.id ? `${CO.gold}22` : "transparent", color: filtro === c.id ? CO.gold : CO.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c.nombre.split(" ")[0]}</button>)}
      </div>
      {filt.map((ev) => (
        <div key={ev.id} onClick={() => setDet(ev)} style={{ background: CO.surfaceLight, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${CO.border}`, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: CO.text }}>{ev.captadorNombre}</div><div style={{ fontSize: 12, color: CO.textMuted, marginTop: 2 }}>{ev.propiedad} · {fmtFecha(ev.fecha)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 900, color: colorNota(ev.ponderado) }}>{ev.ponderado.toFixed(2)}</div><Badge color={ev.ponderado >= META ? CO.success : CO.danger}>{ev.ponderado >= META ? "PASA" : "NO PASA"}</Badge></div>
          </div>
        </div>
      ))}
      {filt.length === 0 && <div style={{ textAlign: "center", padding: 40, color: CO.textMuted }}><div style={{ fontSize: 40, marginBottom: 8 }}>📭</div><p>Sin evaluaciones</p></div>}
      <Modal open={!!det} onClose={() => setDet(null)} title={det ? `${det.captadorNombre} — ${det.ponderado?.toFixed(2)}` : ""}>
        {det && <div>
          <p style={{ fontSize: 13, color: CO.textMuted, marginBottom: 12 }}>{det.propiedad} · {fmtFecha(det.fecha)}</p>
          <CuadranteWidget cuadrante={det.cuadrante} />
          {CRITERIOS.map((cr) => { const cal = det.calificaciones?.[cr.id] || 0, just = det.justificaciones?.[cr.id] || ""; return (<div key={cr.id} style={{ padding: "10px 0", borderBottom: `1px solid ${CO.border}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: CO.text }}>{cr.nombre}</span><span style={{ fontSize: 15, fontWeight: 800, color: colorNota(cal) }}>{cal}</span></div>{just && <p style={{ fontSize: 11, color: CO.textMuted, margin: "3px 0 0" }}>💬 {just}</p>}</div>); })}
        </div>}
      </Modal>
    </div>
  );
}

// ═══ APP ═══
export default function App() {
  const [vista, setVista] = useState("evaluar");
  const [captadores, setCaptadores] = usePersist(SK_CAP, SEED_CAP);
  const [historial, setHistorial] = usePersist(SK_HIST, null);
  useEffect(() => { if (historial === null) setHistorial({}); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(196,154,42,0.4); } 50% { box-shadow: 0 0 0 12px rgba(196,154,42,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: ${CO.gold} !important; box-shadow: 0 0 0 3px ${CO.gold}22; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${CO.border}; border-radius: 4px; }
      `}</style>
      <div style={{ minHeight: "100vh", background: CO.bg, color: CO.text, fontFamily: "'DM Sans',sans-serif", paddingBottom: 80, maxWidth: 480, margin: "0 auto" }}>
        <Header />
        {vista === "evaluar" && <VistaEvaluar captadores={captadores} historial={historial || {}} setHistorial={setHistorial} />}
        {vista === "dashboard" && <VistaDash captadores={captadores} historial={historial || {}} />}
        {vista === "historial" && <VistaHist captadores={captadores} historial={historial || {}} />}
        {vista === "equipo" && <VistaEquipo captadores={captadores} setCaptadores={setCaptadores} />}
        <Nav vista={vista} setVista={setVista} />
      </div>
    </>
  );
}
