const Anthropic = require("@anthropic-ai/sdk");

// Ensure .env contains ANTHROPIC_API_KEY
const client = new Anthropic.default();

const SYSTEM_INSTRUCTION = `You are NexusAI, an intelligent enterprise assistant built exclusively for the NexusAI platform.

Your role:
- Answer questions ONLY related to NexusAI — its features, capabilities, usage, real-time streaming, integrations, enterprise security, and how it works.
- Help users understand what NexusAI can do for them and their organization.
- Assist with any NexusAI-related troubleshooting, guidance, or information.

Strict rules:
- If a user asks something completely unrelated to NexusAI (e.g., general coding help, weather, news, math homework, personal advice, other products), politely decline.
- When declining, say something like: "I'm NexusAI's dedicated assistant and I'm only able to help with questions about NexusAI. Is there anything about NexusAI I can help you with?"
- Do NOT answer off-topic questions even if the user insists.
- Always stay in character as the NexusAI assistant.
- Be professional, concise, and helpful within your defined scope.`;

async function streamResponse(chatHistory, socket) {
  try {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_INSTRUCTION,
      messages: chatHistory, // format: [{role: "user", content: "..."}, ...]
    });

    let fullResponseText = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponseText += event.delta.text;
        socket.emit("ai-message-chunk", { text: fullResponseText });
      }
    }

    // Jab stream khatam ho jaye
    socket.emit("ai-message-done");

    // Return full text so server.js can save it in history
    return fullResponseText;
  } catch (error) {
    console.error("Streaming error:", error);
    socket.emit("ai-message-chunk", {
      text: "\n\n**Error:** Something went wrong generating the response.",
    });
    socket.emit("ai-message-done");
    return "Error generating response.";
  }
}

module.exports = streamResponse;
