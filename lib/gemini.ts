type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GenerateGeminiTextOptions = {
  prompt: string;
  temperature: number;
};

function getGeminiModel() {
  return (process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite").replace(/^models\//, "");
}

export async function generateGeminiText({ prompt, temperature }: GenerateGeminiTextOptions) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(getGeminiModel())}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature
          }
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text =
      data.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    return text || null;
  } catch {
    return null;
  }
}
