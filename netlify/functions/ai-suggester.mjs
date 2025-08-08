const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_API_KEY ; 
const genAi = new GoogleGenerativeAI(api_key);

var admin = require("firebase-admin");
var serviceAccount = process.env.FIREBASE_SERVICE_KEY;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bookwyrm-9fbfd-default-rtdb.firebaseio.com"
});

const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handler = async (event, context) => {
    // Handle OPTIONS requests for CORS pre-flight checks
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: ""
        };
    }

    // Only accept POST requests for actual data processing
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { preference } = JSON.parse(event.body);

        // A more explicit prompt to ensure a clean JSON output
        const prompt = `
            You are a helpful assistant that suggests books;
            Based on the following user preference, suggest three books;
            The user preference is: "${preference}";
            
            Provide the suggestions in a structured JSON format. The format should be an array of objects, with each object having 'title', 'author', and 'summary' keys;
            Do not include any other text, explanations, or code block delimiters;
            
            Example format:
            [
              {
                "title": "Example Title 1",
                "author": "Example Author 1",
                "summary": "A brief summary of the book."
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let bookSuggestions;
        try {
            bookSuggestions = JSON.parse(cleanText);
        } catch (e) {
            console.error("Error parsing Gemini response:", e);
            // Return a specific error message if the API response is not valid JSON
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: "Could not parse API response. Please try again." }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': "*",
            },
            body: JSON.stringify(bookSuggestions),
        };
    } catch (e) {
        console.error("Netlify Function Error:", e);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type':'application/json'
            },
            body: JSON.stringify({ message: 'An internal server error occurred.' }),
        };
    }
};
