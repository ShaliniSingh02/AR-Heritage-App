import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Your Gemini API key (hardcoded quick method)
const GEMINI_API_KEY ="YOUR_API_KEY_HERE";

if (!GEMINI_API_KEY) {
  console.warn("⚠️ No API key found.");
}

app.use(cors());
app.use(express.json());

/**
 * Fallback replies when Gemini quota is exhausted or any error happens.
 * We keep them short and heritage-themed so the app still feels smart.
 */
function getFallbackReply(prompt) {
  const lower = (prompt || "").toLowerCase();

  if (lower.includes("konark")) {
    return (
      "I’ve hit today’s limit for live AI answers, but here’s a quick highlight about the Konark Sun Temple:\n\n" +
      "• 13th-century Sun temple in Odisha, built by King Narasimhadeva I.\n" +
      "• Designed as Surya’s stone chariot with 24 carved wheels and seven horses.\n" +
      "• Famous for its detailed stone carvings and is a UNESCO World Heritage Site.\n\n" +
      "You can explore more details through the Konark card and AR model in this app."
    );
  }

  if (lower.includes("nearby") || lower.includes("near me")) {
    return (
      "Right now I can’t fetch live AI results, but you can still explore amazing Indian heritage sites like:\n\n" +
      "• Taj Mahal – Agra, Uttar Pradesh\n" +
      "• Hampi – Karnataka\n" +
      "• Qutub Minar – Delhi\n" +
      "• Konark Sun Temple – Odisha\n\n" +
      "Use the ‘Explore Sites’ section in this app to browse places and start your own pocket heritage tour."
    );
  }

  if (lower.includes("guided") || lower.includes("walk") || lower.includes("tour")) {
    return (
      "Our live AI guide has reached its free question limit for today, " +
      "but here’s a simple guided-walk idea you can follow at any monument:\n\n" +
      "1️⃣ Start at the main entrance – notice the gateway design and symbols.\n" +
      "2️⃣ Move to the central shrine or hall – look at pillars, ceilings and carvings.\n" +
      "3️⃣ Walk around the outer corridor – many temples use this as a pradakshina path.\n" +
      "4️⃣ End at an open vantage point – observe how the monument sits in its landscape.\n\n" +
      "You can mirror this flow using the AR model and info cards inside the app."
    );
  }

  if (lower.includes("explain") || lower.includes("history") || lower.includes("monument")) {
    return (
      "I can’t reach the live AI model right now, but here’s a general way to understand any Indian monument:\n\n" +
      "• Check the time period: Sultanate, Mughal, Chola, Vijayanagara, etc.\n" +
      "• Look for materials used: sandstone, marble, granite, brick.\n" +
      "• Notice patterns: arches, domes, shikharas, pillars, jalis, murals.\n" +
      "• Read any inscription plates for dates and donors.\n\n" +
      "Use the site description, fun facts and AR model in this app to connect these points to the monument you’re viewing."
    );
  }

  // Generic fallback if nothing specific matches
  return (
    "Our heritage guide has answered a lot today and the live AI limit has been reached, " +
    "so I’m serving a preset response instead of a fresh AI reply.\n\n" +
    "You can still:\n" +
    "• Explore site cards to read curated descriptions and facts.\n" +
    "• Use the AR view to inspect 3D models closely.\n" +
    "• Try quizzes and guided flows built inside the app.\n\n" +
    "Come back later or switch to another API key/plan to re-enable live AI answers."
  );
}

// Function that talks to Gemini API, but safely falls back on errors
async function callGemini(prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const textBody = await response.text();
    let data = null;
    try {
      data = JSON.parse(textBody);
    } catch {
      // not JSON, ignore
    }

    if (!response.ok) {
      console.error("Gemini API Error:", data || textBody);

      // If quota exceeded or any other error -> fallback reply
      return getFallbackReply(prompt);
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || null;

    // If somehow empty, still give a fallback
    if (!reply) {
      return getFallbackReply(prompt);
    }

    return reply;
  } catch (err) {
    console.error("Network/other error talking to Gemini:", err);
    // Any unexpected error -> fallback reply
    return getFallbackReply(prompt);
  }
}

// Chatbot route – always returns { reply } with status 200
app.post("/gemini", async (req, res) => {
  const userMessage = req.body?.message || "";

  if (!userMessage) {
    return res.json({
      reply:
        "You didn’t type a question. Try asking about a monument, a time period, or nearby heritage sites!",
    });
  }

  const reply = await callGemini(userMessage);
  res.json({ reply });
});

// Start backend server
app.listen(PORT, () => {
  console.log(`🚀 Chatbot backend running at http://localhost:${PORT}`);
});