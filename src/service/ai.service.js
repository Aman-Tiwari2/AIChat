const { GoogleGenAI } = require("@google/genai")

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function generateResponse(prompt){
    console.log(prompt)
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    }) 

    return response.text
} 


module.exports = generateResponse;