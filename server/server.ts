import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Permite CV más grandes

// ─────────────────────────────────────────────
// CARGAR CSV CON OFERTAS
// ─────────────────────────────────────────────
const ofertasPath = path.join(__dirname, "data", "ofertas.csv");
let ofertasTexto = "";

try {
  ofertasTexto = fs.readFileSync(ofertasPath, "utf8");
  console.log("CSV de ofertas cargado correctamente desde:", ofertasPath);
} catch (error) {
  console.warn("⚠️ No se encontró el archivo", ofertasPath);
}

// Estado global simple (un solo usuario / demo)
let cvGuardado: string | null = null;
let contextoTrabajo = false;
let areaDefinida: string | null = null;
let modalidadDefinida: "remoto" | "hibrido" | "presencial" | "cualquiera" | null = null;
let ubicacionDefinida: string | null = null;

// Flujo de preguntas: área → modalidad → ubicación
let pasoPendiente: "area" | "modalidad" | "ubicacion" | null = null;

// Helper para resetear conversación (y opcionalmente CV)
function resetConversacion(keepCv: boolean) {
  if (!keepCv) {
    cvGuardado = null;
  }
  contextoTrabajo = false;
  areaDefinida = null;
  modalidadDefinida = null;
  ubicacionDefinida = null;
  pasoPendiente = null;
}

// ─────────────────────────────────────────────
// ENDPOINT PARA SUBIR CV
// ─────────────────────────────────────────────
app.post("/api/cv", (req, res) => {
  const cv = req.body.cv as string | undefined;

  if (!cv || cv.length < 20) {
    return res.status(400).json({ error: "CV inválido o muy corto" });
  }

  // Cada vez que se sube un CV nuevo, reiniciamos TODO (incluyendo CV anterior)
  resetConversacion(false);
  cvGuardado = cv;

  console.log("CV recibido (primeros 50 caracteres):", cvGuardado.slice(0, 50));

  return res.json({ message: "CV recibido correctamente" });
});

// ─────────────────────────────────────────────
// ENDPOINT PARA REINICIAR CONVERSACIÓN
// ─────────────────────────────────────────────
app.post("/api/reset-conversacion", (req, res) => {
  const keepCv = req.body?.keepCv ?? false; // por defecto NO mantener CV
  resetConversacion(keepCv);

  return res.json({
    message: "Conversación reiniciada",
    cvPresente: Boolean(cvGuardado),
  });
});

// ─────────────────────────────────────────────
// ENDPOINT PARA EL CHAT
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Mensaje inválido" });
  }

  // ¿Este mensaje habla de trabajo?
  const hablaTrabajoAhora =
    /trabajo|empleo|oferta|ofertas|trabajar|recomienda|recomendación|recomendacion|recomiéndame|recomiendame|carrera|vocación|vocacion|profesion|profesión/i.test(
      message
    );

  if (hablaTrabajoAhora) {
    contextoTrabajo = true;
    // Si recién entra al tema laboral y no tenemos área, arrancamos el flujo ahí
    if (!areaDefinida && !pasoPendiente) {
      pasoPendiente = "area";
    }
  }

  const hablaTrabajo = contextoTrabajo;
  const tieneCV = Boolean(cvGuardado);

  // ─────────────────────────────────────────────
  // DETECCIÓN BÁSICA EN ESTE MENSAJE
  // (pero el flujo manda, no solo las palabras)
  // ─────────────────────────────────────────────

  const usaCvComoArea =
    /usa .*cv|usa lo que aparece en mi cv|usa lo que sale en mi cv|usa lo de mi cv|usa mi cv/i.test(
      message
    );

  // Modalidad
  const mencionaRemoto = /\bremoto\b|\Remoto\b/i.test(message);
  const mencionaHibrido = /\bhíbrido\b|\bhibrido\b|\bHíbrido\b|\bHibrido\b/i.test(message);
  const mencionaPresencial = /\bpresencial\b|\bPresencial\b/i.test(message);
  const mencionaIndiferente =
    /\bme da lo mismo\b|\bno importa\b|\bcualquiera\b|\bMe da lo mismo\b|\bNo importa\b|\bCualquiera\b/i.test(message);

  // Ubicación: muy simple, pero permitimos cualquier texto si está en flujo
  const ubicacionesTipicas = [
    "santiago",
    "rm",
    "region metropolitana",
    "region metropolitana",
    "valparaíso",
    "valparaiso",
    "arica", 
    "tarapacá", 
    "tarapaca", 
    "calama", 
    "iquique", 
    "coquimbo", 
    "viña", 
    "viña del mar", 
    "los andes",  
    "rancagua",
    "temuco", 
    "osorno", 
    "puerto montt", 
    "puerto varas", 
    "punta arenas", 
    "antofagasta",
    "biobío",
    "biobio",
    "concepción",
    "conce",
    "chile",
    "Santiago",
    "RM",
    "Region metropolitana",
    "Region metropolitana",
    "Valparaíso",
    "Valparaiso",
    "Arica", 
    "Tarapacá", 
    "Tarapaca", 
    "Calama", 
    "Iquique", 
    "Coquimbo", 
    "Viña", 
    "Viña del mar", 
    "Los Andes",  
    "Rancagua",
    "Temuco", 
    "Osorno", 
    "Puerto Montt", 
    "Puerto Varas", 
    "Punta Arenas", 
    "Antofagasta",
    "Biobío",
    "Biobio",
    "Concepción",
    "Conce",
    "Chile",
  ];
  const ubicacionDetectada = ubicacionesTipicas.find((u) =>
    new RegExp("\\b" + u + "\\b", "i").test(message)
  );

  // ─────────────────────────────────────────────
  // APLICAR RESPUESTA AL FLUJO PENDIENTE
  // ─────────────────────────────────────────────

  // Si estamos en flujo de preguntas, lo que manda es "pasoPendiente"
  // 1) Esperando ÁREA
  if (pasoPendiente === "area") {
    if (usaCvComoArea) {
      areaDefinida = "desde_cv";
      pasoPendiente = "modalidad";
    } else if (message.trim().length > 1) {
      // ÁREA LIBRE: cualquier texto sirve ("optimización", "minería", etc.)
      areaDefinida = message.trim();
      pasoPendiente = "modalidad";
    }
  }

  // 2) Esperando MODALIDAD
  if (pasoPendiente === "modalidad") {
    if (mencionaIndiferente) {
      modalidadDefinida = "cualquiera";
      pasoPendiente = null; // no necesitamos ubicación obligatoria
    } else if (mencionaRemoto) {
      modalidadDefinida = "remoto";
      pasoPendiente = null; // remoto → ubicación opcional
    } else if (mencionaHibrido) {
      modalidadDefinida = "hibrido";
      pasoPendiente = "ubicacion"; // híbrido → preguntar ubicación
    } else if (mencionaPresencial) {
      modalidadDefinida = "presencial";
      pasoPendiente = "ubicacion"; // presencial → preguntar ubicación
    }
  }

  // 3) Esperando UBICACIÓN
  if (pasoPendiente === "ubicacion") {
    if (mencionaIndiferente) {
      ubicacionDefinida = "cualquiera";
      pasoPendiente = null;
    } else if (ubicacionDetectada || message.trim().length > 1) {
      // Aceptamos cualquier ciudad/región que escriba
      ubicacionDefinida = message.trim();
      pasoPendiente = null;
    }
  }

  // Si aún no se inició el flujo pero ya habla de trabajo
  if (hablaTrabajo && !areaDefinida && !pasoPendiente) {
    pasoPendiente = "area";
  }

  // ─────────────────────────────────────────────
  // CÁLCULO DE FLAGS
  // ─────────────────────────────────────────────

  const requiereUbicacion =
    modalidadDefinida === "hibrido" || modalidadDefinida === "presencial";

  const debePreguntarArea = pasoPendiente === "area";
  const debePreguntarModalidad = pasoPendiente === "modalidad";
  const debePreguntarUbicacion = pasoPendiente === "ubicacion";

  const listoParaRecomendar =
    hablaTrabajo &&
    !!areaDefinida &&
    !!modalidadDefinida &&
    (!requiereUbicacion || !!ubicacionDefinida) &&
    pasoPendiente === null;

  console.log("DEBUG ESTADO:", {
    hablaTrabajo,
    areaDefinida,
    modalidadDefinida,
    ubicacionDefinida,
    pasoPendiente,
    debePreguntarArea,
    debePreguntarModalidad,
    debePreguntarUbicacion,
    listoParaRecomendar,
  });

  // ─────────────────────────────────────────────
  // SYSTEM PROMPT PARA LA IA
  // ─────────────────────────────────────────────

  const systemPrompt = `
Eres un orientador laboral experto. Trabajas con el CV del usuario, sus preferencias y el siguiente CSV de ofertas para ayudarle a encontrar los mejores empleos posibles.

ESTADO (NO SE LO DIGAS AL USUARIO):
- hablaTrabajo = ${hablaTrabajo ? "sí" : "no"}
- areaDefinida = ${areaDefinida ?? "(aún no definida)"}
- modalidadDefinida = ${modalidadDefinida ?? "(aún no definida)"}
- ubicacionDefinida = ${ubicacionDefinida ?? "(aún no definida)"}
- pasoPendiente = ${pasoPendiente ?? "ninguno"}
- debePreguntarArea = ${debePreguntarArea ? "sí" : "no"}
- debePreguntarModalidad = ${debePreguntarModalidad ? "sí" : "no"}
- debePreguntarUbicacion = ${debePreguntarUbicacion ? "sí" : "no"}
- listoParaRecomendar = ${listoParaRecomendar ? "sí" : "no"}

REGLA GLOBAL MUY IMPORTANTE:
- SOLO puedes hacer **UNA** de estas cosas en cada turno:
  1) Preguntar por área,
  2) Preguntar por modalidad,
  3) Preguntar por ubicación,
  4) O recomendar empleos.
- NUNCA combines dos de estas acciones en la misma respuesta.

1) FLUJO DE PREGUNTAS (ESTRUCTURA OBLIGATORIA)
------------------------------------------------
A) Si "debePreguntarArea" = "sí":
   ➤ Tu respuesta DEBE ser SOLO esta pregunta (y nada más):
   "¿Tienes alguna área de interés específica (por ejemplo: datos, desarrollo web, soporte, ciberseguridad, UX, marketing, etc.) o prefieres que use lo que aparece en tu CV?"
   ➤ No recomiendes empleos.
   ➤ No pidas modalidad ni ubicación.
   ➤ No hables del CSV ni del porcentaje de match.
   ➤ Responde en un solo párrafo con esa pregunta, como máximo con una frase breve antes.

B) Si "debePreguntarArea" = "no" Y "debePreguntarModalidad" = "sí":
   ➤ Tu respuesta DEBE ser SOLO esta pregunta:
   "¿Qué modalidad prefieres: remoto, híbrido, presencial o me da lo mismo?"
   ➤ No recomiendes empleos.
   ➤ No pidas ubicación.
   ➤ No hables del CSV ni del porcentaje de match.

C) Si "debePreguntarArea" = "no", "debePreguntarModalidad" = "no" Y "debePreguntarUbicacion" = "sí":
   ➤ Tu respuesta DEBE ser SOLO esta pregunta:
   "¿En qué ciudad o región te gustaría trabajar? Si te da lo mismo la ubicación, también puedes decir 'me da lo mismo'."
   ➤ No recomiendes empleos.
   ➤ No hables del CSV ni del porcentaje de match.

D) Solo si "listoParaRecomendar" = "sí":
   ➤ Puedes usar el CSV de ofertas y recomendar empleos, siguiendo las reglas de abajo.

2) ANÁLISIS DEL CV (SI EXISTE)
------------------------------------------------
- Si hay CV, léelo y coméntalo cuando vayas a recomendar empleos o cuando el usuario hable de su perfil:
  - Experiencia principal.
  - Fortalezas detectadas.
  - Áreas mejorables.
  - Nivel técnico aproximado.
  - Un pequeño resumen de quién es el/la candidato/a.

- Si NO hay CV, igual puedes orientar, pero sugiérele subir uno para mejorar la recomendación.

CV DEL USUARIO:
${tieneCV ? cvGuardado : "(no hay CV cargado todavía)"}

3) CUANDO "listoParaRecomendar" = "sí": USO DEL CSV + FILTRO DE MODALIDAD + % MATCH
------------------------------------------------
Solo cuando "listoParaRecomendar" = "sí" y el usuario está claramente pidiendo recomendaciones laborales, usa el CSV:

${
  hablaTrabajo
    ? ofertasTexto
    : "(el usuario no pidió trabajo, NO USES el CSV ni recomiendes empleos concretos)."
}

Al recomendar empleos, sigue SIEMPRE este orden:

1) FILTRO DURO POR MODALIDAD (según "modalidadDefinida")
   - Si modalidadDefinida = "remoto": SOLO ofertas "Remoto".
   - Si modalidadDefinida = "presencial": SOLO ofertas "Presencial".
   - Si modalidadDefinida = "hibrido": SOLO ofertas "Híbrido".
   - Si modalidadDefinida = "cualquiera": cualquier modalidad.

2) (Opcional) FILTRO POR UBICACIÓN
   - Si modalidadDefinida es "presencial" o "hibrido" Y ubicacionDefinida NO es "cualquiera" ni nula:
       ➤ Da prioridad a las ofertas con ubicación similar a "ubicacionDefinida".
   - Si modalidadDefinida es "remoto" o ubicacionDefinida = "cualquiera":
       ➤ No apliques filtro duro por ubicación.

3) CÁLCULO DEL % DE MATCH (SOLO ENTRE LAS OFERTAS QUE PASARON LOS FILTROS)
   - Estimación mental:
     - Hasta 50%: similitud de habilidades/tecnologías entre el CV y "habilidades".
     - Hasta 30%: encaje entre experiencia requerida y experiencia del candidato.
     - Hasta 20%: alineación con el área de interés (texto de "areaDefinida").

   - No expliques la fórmula; solo usa un porcentaje razonable entre 0% y 100%.

4) SELECCIÓN Y PRESENTACIÓN
   - Elige los **3 empleos con mayor match** (después de los filtros).
   - Preséntalos así:

**🎯 Top 3 empleos recomendados para ti:**

1. **[Título del puesto] – [Empresa]**  
   - Match estimado: 87%  
   - Ubicación/modalidad: [ubicación], [modalidad]  
   - Motivo del encaje: (2–3 líneas explicando por qué calza con su experiencia, habilidades y preferencias).

[...]

4) ESTILO DE RESPUESTA
------------------------------------------------
- Lenguaje natural, cercano y motivador.
- Usa Markdown simple: **negritas**, listas, párrafos cortos.
- Evita repetir textualmente lo mismo muchas veces.
- No inventes datos del CSV (usa solo lo que está en el texto).
- Respeta SIEMPRE el flujo de preguntas anterior cuando falte información.
`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error de Deepseek:", text);
      return res.status(500).json({ error: text });
    }

    const json = await response.json();
    const reply = json?.choices?.[0]?.message?.content ?? "(sin respuesta)";
    res.json({ reply });
  } catch (err) {
    console.error("Error interno en el servidor:", err);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor IA corriendo en el puerto ${PORT}`);
});



