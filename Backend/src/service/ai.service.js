const { GoogleGenAI } = require("@google/genai");

// Ensure .env contains GEMINI_API_KEY
const ai = new GoogleGenAI({}); 

async function streamResponse(chatHistory, socket) {
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: chatHistory, 
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500, // Thoda bada response allow karne ke liye
      },
    });

    let fullResponseText = "";

    // Jaise-jaise word aayega, usko 'fullResponseText' mein jodenge
    // aur phir poora ka poora text frontend ko bhejenge
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullResponseText += chunk.text;
        socket.emit('ai-message-chunk', { text: fullResponseText });
      }
    }
    
    // Jab stream khatam ho jaye
    socket.emit('ai-message-done');
    
    // Return full text so server.js can save it in history
    return fullResponseText; 

  } catch (error) {
    console.error("Streaming error:", error);
    socket.emit('ai-message-chunk', { text: "\n\n**Error:** Something went wrong generating the response." });
    socket.emit('ai-message-done');
    return "Error generating response.";
  }
}

module.exports = streamResponse;

// const { GoogleGenAI } = require("@google/genai");

// // The client gets the API key from the environment variable `GEMINI_API_KEY`.
// const ai = new GoogleGenAI({});

// async function generateResponse(prompt) {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: prompt,
//     generationConfig: {
//       temperature: 0.7,
//       maxOutputTokens: 1024,
//     },
//   });

//   const cleanText = response?.text?.trim() || "No response generated";
//   console.log(cleanText);
//   return cleanText;
// }

// module.exports = generateResponse;
