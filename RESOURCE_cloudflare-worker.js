// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to name your secret OPENAI_API_KEY in the Cloudflare Workers dashboard
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const userInput = await request.json();

    // Add a system prompt to instruct the AI to only answer L'Oréal and beauty-related questions
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal products, routines, recommendations, or beauty-related topics. If asked about anything else, politely refuse and explain you can only help with L'Oréal and beauty-related questions.",
    };

    // Insert system prompt at the start of the messages array (if not already present)
    let messages = userInput.messages || [];
    if (!messages.length || messages[0].role !== "system") {
      messages = [systemPrompt, ...messages];
    }

    const requestBody = {
      model: "gpt-4o",
      messages: messages,
      max_completion_tokens: 300,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
