exports.handler = async function(event) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    var body = JSON.parse(event.body);
    var transcripcion = body.transcripcion;
    var apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "No API key configurada" }) };

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
        messages: [{
          role: "user",
          content: "Eres evaluador REPIC v3.1 de Inmobili Internacional, inmobiliaria en Gomez Palacio, Durango, Mexico. Evaluas visitas de captacion inmobiliaria.\n\nCUADRANTE DE DECISIONES (sistema para decidir si captar o no):\n1. Precio vs avaluo - esta el precio del dueno dentro del avaluo realista?\n2. Riesgo juridico - escrituras en orden? notaria certificada?\n3. Disposicion ganar-ganar - el dueno esta dispuesto a negociar?\n4. Inmobili es primera opcion? - o ya tiene otra inmobiliaria?\nSi 2 o mas factores son negativos = NO captar.\n\nRango de precio mas vendible: $520,000 a $790,000.\n\n13 CRITERIOS con peso:\n1. Analisis pre-visita (5%) - investigo antes de llegar?\n2. Conexion y confianza (8%) - genero rapport?\n3. Escucha activa (8%) - parafraseo, preguntas de profundizacion?\n4. Resumen de confirmacion (12%) - hizo resumen tipo dejame ver si entendi? CRITICO\n5. Tomador de decision (10%) - pregunto quien decide?\n6. Evaluacion fisica (8%) - menciono m2, recamaras, estado?\n7. Educacion valor avaluo (8%) - explico calculo de valor?\n8. Propuesta desglosada (10%) - presento precio neto + honorarios?\n9. Paquetes de servicio (5%) - ofrecio paquetes diferenciados?\n10. Manejo de objeciones (8%) - respondio dudas con datos?\n11. Pregunta de cierre (5%) - pidio compromiso directo?\n12. Documentacion en campo (5%) - tomo fotos, midio, documentos?\n13. Analisis post-visita (5%) - grabo conclusion? aplico cuadrante?\n\nESCALA: 1=No lo hizo | 2=Muy deficiente | 3=Aceptable | 4=Bien | 5=Excepcional\nSi NO se menciono en la transcripcion = 1. Se justo pero exigente.\n\nResponde UNICAMENTE con JSON valido, sin backticks, sin texto extra:\n{\"evaluaciones\":[{\"id\":1,\"cal\":3,\"just\":\"razon breve\"},{\"id\":2,\"cal\":2,\"just\":\"razon\"},...hasta el 13],\"cuadrante\":{\"precioAvaluo\":\"ok\",\"riesgoJuridico\":\"ok\",\"ganarGanar\":\"ok\",\"primeraOpcion\":\"ok\",\"decision\":\"CAPTAR\",\"razon\":\"explicacion breve\"}}\n\nTRANSCRIPCION DE LA VISITA:\n" + transcripcion
        }]
      })
    });

    if (!response.ok) {
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: "Error API " + response.status }) };
    }

    var data = await response.json();
    var text = data.content.map(function(item) { return item.text || ""; }).join("");
    return { statusCode: 200, headers: headers, body: text };
  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "Error interno: " + err.message }) };
  }
};
