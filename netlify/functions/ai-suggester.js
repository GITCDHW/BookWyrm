import {GoogleGenerativeAI} from '@google/generative-ai';
const api_key="AIzaSyAl2eXSXR2Hhx6faUAIEekwOoxOWUOsKQc"
const genAi = new GoogleGenerativeAI(api_key)

const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        exports.handler = async (event, context) => {
    // We only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
    if (event.httpMethod==='OPTIONS') {
      return{
        statusCode:204,
        headers:{
          'Access-Control-Allow-Origin':"*",
          'Access-Control-Allow-Headers':"Content-Type",
          'Access-Control-Allow-Methods':"POST,OPTIONS",
        },
        body:""
      }
    }
    try {
      const {preference} = JSON.parse(event.body)
      
              // Define the prompt for the model
        const prompt = `
            You are a helpful assistant that suggests books.
            Based on the following user preference, suggest three books.
            The user preference is: "${preference}".

            Provide the suggestions in a structured JSON format. The format should be an array of objects, with each object having 'title', 'author', and 'summary' keys.
            Example format:
            [
              {
                "title": "Example Title 1",
                "author": "Example Author 1",
                "summary": "A brief summary of the book."
              },
              {
                "title": "Example Title 2",
                "author": "Example Author 2",
                "summary": "A brief summary of the book."
              }
            ]
        `;
        const result = await model.generateContent(prompt)
        const response= await result.response
        const text=response.text()
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const bookSuggestions = JSON.parse(cleanText);

// Return the JSON suggestions
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin':"*",
  },
  body: JSON.stringify(bookSuggestions),
};
    } catch (e) {
      console.log("error in netlify function")
    }
        }
