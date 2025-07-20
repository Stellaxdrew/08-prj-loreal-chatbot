/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */

// Helper function to check if the question is about L'Oréal
function isLorealRelated(text) {
  // List of keywords related to L'Oréal products and routines
  const keywords = [
    "l'oreal",
    "loreal",
    "makeup",
    "skincare",
    "haircare",
    "fragrance",
    "routine",
    "product",
    "recommendation",
    "serum",
    "mascara",
    "foundation",
    "shampoo",
    "conditioner",
    "lipstick",
    "cream",
    "moisturizer",
    "sunscreen",
    "cleanser",
    "toner",
    "eye cream",
    "face wash",
    "beauty",
    "brand",
  ];
  const lower = text.toLowerCase();
  // Check if any keyword is present in the user's message
  return keywords.some((word) => lower.includes(word));
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // Only allow questions about L'Oréal products, routines, and recommendations
  if (!isLorealRelated(userMsg)) {
    chatWindow.innerHTML += `<div class="msg user">${userMsg}</div>`;
    chatWindow.innerHTML += `<div class="msg ai">Sorry, I can only answer questions about L'Oréal products, routines, and recommendations.</div>`;
    userInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Show user message in chat window
  chatWindow.innerHTML += `<div class="msg user">${userMsg}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
  userInput.value = "";

  // Store conversation history
  if (!window.chatHistory) {
    window.chatHistory = [
      {
        role: "system",
        content:
          "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal products, routines, and recommendations. If asked about anything else, politely refuse.",
      },
    ];
  }
  window.chatHistory.push({ role: "user", content: userMsg });

  // Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "msg ai";
  loadingMsg.textContent = "Thinking...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Send request to Cloudflare Worker (which calls OpenAI API)
  fetch("https://loral-chatbot.stella-nyangamoi.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: window.chatHistory }),
  })
    .then((res) => res.json())
    .then((data) => {
      // Get the assistant's reply
      const aiMsg =
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
          ? data.choices[0].message.content
          : "Sorry, I couldn't get a response.";
      // Remove loading message
      chatWindow.removeChild(loadingMsg);
      // Show assistant's reply
      chatWindow.innerHTML += `<div class="msg ai">${aiMsg}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      // Add assistant reply to history
      window.chatHistory.push({ role: "assistant", content: aiMsg });
    })
    .catch(() => {
      chatWindow.removeChild(loadingMsg);
      chatWindow.innerHTML += `<div class="msg ai">Sorry, there was a problem connecting to the chatbot.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
});
