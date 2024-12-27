const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup
const API_KEY_OPENAI = "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";
const API_KEY_GOOGLE = "AIzaSyDPr2HcB2IbySwL2B5N91oJhxaeDl222Dw";
const OPENAI_DALLE_API_URL = "https://api.openai.com/v1/images/generations"; // API para generar imágenes
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY_GOOGLE}`; // API de Google Gemini

// Función para crear el mensaje
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Función para generar la respuesta de OpenAI (Texto)
const generateOpenAIResponse = async (message) => {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY_OPENAI}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error en la respuesta de OpenAI:", error);
    return "Lo siento, ocurrió un error al obtener la respuesta.";
  }
};

// Función para generar la respuesta de Google Gemini (Texto y multimedia)
const generateGoogleResponse = async (message) => {
  try {
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Google Response:", data); // Para depuración

    const apiResponseText = data.candidates[0]?.content?.parts[0]?.text?.replace(/\*\*(.*?)\*\*/g, "$1").trim() || "Hola, soy Miguel IA. ¿Cómo puedo ayudarte?";
    const apiResponseMedia = data.candidates[0]?.content?.parts[0]?.inline_data || {};

    return {
      text: apiResponseText,
      image: apiResponseMedia.image_url || null,
      audio: apiResponseMedia.audio_url || null,
      video: apiResponseMedia.video_url || null,
    };
  } catch (error) {
    console.error("Error en la respuesta de Google Gemini:", error);
    return {
      text: "Lo siento, ocurrió un error al obtener la respuesta.",
      image: null,
      audio: null,
      video: null,
    };
  }
};

// Función para generar imágenes con DALL·E de OpenAI
const generateImageWithDALL_E = async (prompt) => {
  try {
    const response = await fetch(OPENAI_DALLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY_OPENAI}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: "1024x1024", // Tamaño de la imagen
      }),
    });

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error("Error generando imagen con DALL·E:", error);
    return null;
  }
};

// Función para manejar la respuesta del bot (OpenAI o Google Gemini)
const handleBotResponse = async (message) => {
  const incomingMessageDiv = createMessageElement('<div class="message-text">Miguel IA está pensando...</div>', "bot-message");
  chatBody.appendChild(incomingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  const defaultResponse = "Hola, soy Miguel IA. ¿Cómo puedo ayudarte?";

  // Obtención de respuesta de Google Gemini
  const responseFromGoogle = await generateGoogleResponse(message);
  const responseFromOpenAI = await generateOpenAIResponse(message);

  // Preferimos la respuesta de Google Gemini
  const responseText = responseFromGoogle.text || responseFromOpenAI || defaultResponse;
  incomingMessageDiv.querySelector(".message-text").innerHTML = "Miguel IA: " + responseText;

  // Manejo de imágenes desde Google Gemini
  if (responseFromGoogle.image) {
    const imageElement = document.createElement("img");
    imageElement.src = responseFromGoogle.image;
    imageElement.classList.add("attachment");
    incomingMessageDiv.appendChild(imageElement);
  }

  // Generar imagen con OpenAI si el mensaje menciona "imagen"
  if (message.includes("imagen")) {
    const imageUrl = await generateImageWithDALL_E("A futuristic city skyline at sunset");
    if (imageUrl) {
      const imageElement = document.createElement("img");
      imageElement.src = imageUrl;
      imageElement.classList.add("attachment");
      incomingMessageDiv.appendChild(imageElement);
    }
  }

  // Manejo de videos y audios desde Google Gemini
  if (responseFromGoogle.audio) {
    const audioElement = document.createElement("audio");
    audioElement.src = responseFromGoogle.audio;
    audioElement.controls = true;
    incomingMessageDiv.appendChild(audioElement);
  }

  if (responseFromGoogle.video) {
    const videoElement = document.createElement("video");
    videoElement.src = responseFromGoogle.video;
    videoElement.controls = true;
    incomingMessageDiv.appendChild(videoElement);
  }

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

// Manejo del envío del mensaje por parte del usuario
const handleOutgoingMessage = (e) => {
  e.preventDefault();

  const message = messageInput.value.trim();
  if (message === "") return;

  messageInput.value = "";
  const messageContent = `<div class="message-text">${message}</div>`;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);

  handleBotResponse(message); // Generar respuesta del bot

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

// Funcionalidad de abrir y cerrar el chatbot
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("chatbot-open");
});

closeChatbot.addEventListener("click", () => {
  document.body.classList.remove("chatbot-open");
});

// Manejo del evento de enviar mensaje
sendMessage.addEventListener("click", handleOutgoingMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    handleOutgoingMessage(e);
  }
});
