require("dotenv").config();
const app = require('./src/app');
const { createServer } = require("http");
const { Server } = require("socket.io");
const streamResponse = require('./src/service/ai.service');

const httpServer = createServer(app);
const io = new Server(httpServer, { 
  cors: {
    origin: "http://localhost:5173", // Apne React app ka URL ensure karein
  }
});

io.on("connection", (socket) => {
  console.log("Socket Connection Initialized:", socket.id);

  // Har user ki apni history
  const chatHistory = []; 

  socket.on("ai-message", async (data) => {
    // 1. User message save in history
    chatHistory.push({
        role: "user",
        parts: [{ text: data.input }]
    });

    // 2. AI se streaming start karwao
    const fullResponse = await streamResponse(chatHistory, socket);
    
    // 3. AI response ko bhi history mein save karo context ke liye
    if (fullResponse) {
        chatHistory.push({
            role: "model",
            parts: [{ text: fullResponse }]
        });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});


// require("dotenv").config()
// const app = require('./src/app')
// const {createServer} = require("http")
// const { Server } = require("socket.io")
// const generateResponse = require('./src/service/ai.service')


// const httpServer = createServer(app);
// const io = new Server(httpServer, { 
//   cors:{
//     origin: "http://localhost:5173",
//   }
// });

// const chatHistory = []



// io.on("connection", (socket) => {
//   console.log("Socket Connection Initialized");

  

//   socket.on("ai-message", async (data) => {
//     chatHistory.push({
//         role:"user",
//         parts: [{ text: data.input }]
//     })

//     const response = await generateResponse(chatHistory)
    

//     chatHistory.push({
//         role:"model",
//         parts:[{ text : response}]
//     })


//     socket.emit("ai-message-response", {response})
    
//   })
  
// });

// httpServer.listen(3000, ()=>{
//     console.log("Server is running on port 3000");
// })