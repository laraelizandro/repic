exports.handler = async function(event, context) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    var requestBody = JSON.parse(event.body);
    var transcripcion = requestBody.transcripcion;

    if (!transcripcion || transcripcion.trim().length < 20) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Transcripcion muy corta" }) };
    }

    var apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "API key no configurada en Netlify" }) };
    }

    var promptText = "Eres el evaluador experto del sistema REPIC v3.1 de Inmobili Internacional, inmobiliaria en Gomez Palacio, Durango, Mexico. Tu trabajo es evaluar la calidad de una visita de captacion inmobiliaria basandote en la transcripcion de la conversacion.\n\n";
    promptText += "CUADRANTE DE DECISIONES (sistema para decidir si captar o no):\n";
    promptText += "1. Precio vs avaluo - el precio del dueno esta dentro del avaluo realista?\n";
    promptText += "2. Riesgo juridico - escrituras en orden? notaria certificada?\n";
    promptText += "3. Disposicion ganar-ganar - dueno dispuesto a negociar?\n";
    promptText += "4. Inmobili es primera opcion? o ya tiene otra inmobiliaria?\n";
    promptText += "Si 2 o mas factores son negativos = NO captar.\n\n";
    promptText += "CRITERIOS DE EVALUACION:\n";
    promptText += "1. Analisis pre-visita (peso 5%) - Investigo al propietario, zona, precios ANTES de llegar?\n";
    promptText += "2. Conexion y confianza (peso 8%) - Genero rapport? Uso nombre del propietario?\n";
    promptText += "3. Escucha activa (peso 8%) - Parafraseo? Hizo preguntas de profundizacion?\n";
    promptText += "4. Resumen de confirmacion (peso 12%) - Hizo resumen tipo Dejame ver si entendi? CRITICO\n";
    promptText += "5. Tomador de decision (peso 10%) - Pregunto quien decide? Identifico copropietarios?\n";
    promptText += "6. Evaluacion fisica (peso 8%) - Menciono m2, recamaras, estado, mejoras?\n";
    promptText += "7. Educacion valor avaluo (peso 8%) - Explico calculo de valor? Educo sobre sobrevalorar?\n";
    promptText += "8. Propuesta desglosada (peso 10%) - Presento precio neto + honorarios con transparencia?\n";
    promptText += "9. Paquetes de servicio (peso 5%) - Ofrecio paquetes diferenciados 5%, 6%, 7%?\n";
    promptText += "10. Manejo de objeciones (peso 8%) - Respondio objeciones con datos sin presionar?\n";
    promptText += "11. Pregunta de cierre (peso 5%) - Pidio compromiso directo?\n";
    promptText += "12. Documentacion en campo (peso 5%) - Tomo fotos, midio, recopilo documentos?\n";
    promptText += "13. Analisis post-visita (peso 5%) - Grabo conclusion? Aplico Cuadrante de Decisiones?\n\n";
    promptText += "ESCALA: 1=No lo hizo | 2=Muy deficiente | 3=Aceptable pero incompleto | 4=Bien hecho | 5=Excepcional\n";
    promptText += "Si algo NO se menciono en la transcripcion = 1. Se justo pero exigente.\n\n";
    promptText += "Responde UNICAMENTE con JSON valido, sin backticks, sin texto adicional:\n";
    promptText += "{\"evaluaciones\":[{\"id\":1,\"cal\":3,\"just\":\"razon breve\"},{\"id\":2,\"cal\":4,\"just\":\"razon breve\"},...hasta el 13],\"cuadrante\":{\"precioAvaluo\":\"ok/riesgo/na\",\"riesgoJuridico\":\"ok/riesgo/na\",\"ganarGanar\":\"ok/riesgo/na\",\"primeraOpcion\":\"ok/riesgo/na\",\"decision\":\"CAPTAR/NO CAPTAR/PENDIENTE\",\"razon\":\"explicacion breve\"}}\n\n";
    promptText += "TRANSCRIPCION DE LA VISITA:\n";
    promptText += transcripcion;

    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: promptText }]
      })
    });

    if (!response.ok) {
      var errorText = await response.text();
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: "Error API: " + response.status, detail: errorText }) };
    }

    var data = await response.json();
    var resultText = "";
    for (var i = 0; i < data.content.length; i++) {
      if (data.content[i].text) resultText += data.content[i].text;
    }
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    return { statusCode: 200, headers: headers, body: resultText };
  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "Error interno: " + err.message }) };
  }
};
