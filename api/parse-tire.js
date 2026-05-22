export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const transcript = req.body?.transcript;
  if (typeof transcript !== "string" || !transcript.trim()) {
    return res.status(400).json({ error: "Missing or invalid transcript" });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 256,
        system: [
          {
            type: "text",
            text: "You are a tire inventory parser. Extract tire details from natural speech and return ONLY a valid JSON object with these exact fields: brand, model, size, condition (New or Used), quantity (number), price (number). If a field is not mentioned use empty string for text fields and 0 for numbers. Return only the JSON, no other text.",
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: transcript.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errBody);
      return res.status(502).json({ error: "Failed to parse tire details", details: errBody, status: anthropicRes.status });
    }

    const data = await anthropicRes.json();
    const text =
      data.content?.find((c) => c.type === "text")?.text ?? data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: "Could not parse tire details from response" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("parse-tire error:", err);
    return res.status(500).json({ error: err.message || "Failed to parse tire details" });
  }
}
