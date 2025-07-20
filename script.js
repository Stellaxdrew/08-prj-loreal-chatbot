// DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.innerHTML =
  '<div class="msg ai"><div>👋 Hello! How can I help you today?</div></div>';

// Helper function to check if the question is about L'Oréal
function isLorealRelated(text) {
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
  return keywords.some((word) => lower.includes(word));
}

// Track user name and past questions
let userName = null;
let pastQuestions = [];

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // Only allow questions about L'Oréal products, routines, and recommendations
  if (!isLorealRelated(userMsg)) {
    chatWindow.innerHTML += `<div class=\"msg user\"><span class=\"avatar\">You</span><div class=\"bubble\">${userMsg}</div></div>`;
    chatWindow.innerHTML += `<div class=\"msg ai\"><span class=\"avatar\">AI</span><div class=\"bubble\">Sorry, I can only answer questions about L'Oréal products, routines, and recommendations.</div></div>`;
    userInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Show user message in chat window
  chatWindow.innerHTML += `<div class=\"msg user\"><span class=\"avatar\">You</span><div class=\"bubble\">${userMsg}</div></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
  userInput.value = "";

  // Try to extract user name if not set
  if (!userName) {
    const nameMatch = userMsg.match(/my name is ([a-zA-Z]+)/i);
    if (nameMatch) {
      userName = nameMatch[1];
    }
  }

  // Store past questions
  pastQuestions.push(userMsg);

  // Store conversation history for OpenAI
  if (!window.chatHistory) {
    window.chatHistory = [
      {
        role: "system",
        content:
          "You are a helpful assistant for L'Oréal. Remember the user's name if provided, and use details from previous questions to give natural, multi-turn answers. Only answer questions about L'Oréal products, routines, recommendations, or beauty-related topics. If asked about anything else, politely refuse.",
      },
    ];
  }
  // Optionally, add user name and past questions as context
  if (userName) {
    window.chatHistory.push({
      role: "user",
      content: `My name is ${userName}.`,
    });
  }
  if (pastQuestions.length > 1) {
    window.chatHistory.push({
      role: "user",
      content: `Here are my previous questions: ${pastQuestions
        .slice(0, -1)
        .join(" | ")}`,
    });
  }
  window.chatHistory.push({ role: "user", content: userMsg });

  // Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "msg ai";
  loadingMsg.innerHTML =
    '<span class="avatar">AI</span><div class="bubble">Thinking...</div>';
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
      // Format the assistant's reply for readability
      let formattedMsg = aiMsg
        .replace(/\n{2,}/g, "<br><br>")
        .replace(/\n/g, "<br>")
        .replace(
          /(?:^|<br>)([-*•])\s?(.+?)(?=<br>|$)/g,
          (match, bullet, item) => `<li>${item.trim()}</li>`
        );
      if (formattedMsg.includes("<li>")) {
        formattedMsg = formattedMsg.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
      }
      chatWindow.innerHTML += `<div class="msg ai"><span class="avatar">AI</span><div class="bubble">${formattedMsg}</div></div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      // Add assistant reply to history
      window.chatHistory.push({ role: "assistant", content: aiMsg });
    })
    .catch(() => {
      chatWindow.removeChild(loadingMsg);
      chatWindow.innerHTML += `<div class="msg ai"><div>Sorry, there was a problem connecting to the chatbot.</div></div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
});
