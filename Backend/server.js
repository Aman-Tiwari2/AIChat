require("dotenv").config();
const app = require('./src/app');
const { createServer } = require("http");
const { Server } = require("socket.io");
const streamResponse = require('./src/service/ai.service'); 

const httpServer = createServer(app);
const io = new Server(httpServer, { 
  cors: {
    origin: "http://localhost:5173", 
  }
});

io.on("connection", (socket) => {
  console.log("Socket Connection Initialized:", socket.id);

  // Har user ke liye alag memory array
  const chatHistory = []; 

  socket.on("ai-message", async (data) => {
    // 1. User message save karein (Anthropic format)
    chatHistory.push({
        role: "user",
        content: data.input
    });

    // 2. AI se streaming start karwao
    const fullResponse = await streamResponse(chatHistory, socket);

    // 3. AI ka response history mein save karein (Anthropic format)
    if (fullResponse) {
        chatHistory.push({
            role: "assistant",
            content: fullResponse
        });
    }

    // 4. AUTO-CLEANUP: Agar history mein 20 se zyada items ho jayein (10 Q&A pairs),
    // toh sabse purane 2 items (1 user, 1 bot) delete kar do taaki API error na aaye.
    if (chatHistory.length > 20) {
        chatHistory.splice(0, 2);
    }
  });

  // 5. MANUAL CLEAR: Jab user UI se "Clear Chat" button dabaye
  socket.on("clear-chat", () => {
    chatHistory.length = 0; // Array completely empty ho jayega
    console.log(`Memory cleared for user: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});

