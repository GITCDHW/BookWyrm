const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_API_KEY ; 
const genAi = new GoogleGenerativeAI(api_key);

var admin = require("firebase-admin");
var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);

const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handler = async (event, context) => {
    const initFirebase = () => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://bookwyrm-9fbfd-default-rtdb.firebaseio.com"
        });
    } catch (e) {
        console.log("error initialising firebase", e)
    }
}

    initFirebase()
    const db = admin.database()
    const booksRef = db.ref("bookList")
    const res = await booksRef.once("value")
    const booksData=res.val()
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
    You are a strict and helpful book recommender. Your only source of information is the JSON array of books provided below.

    Here is the complete list of books and their details:
    ${JSON.stringify(booksData)}

    The user's preference is: "${preference}".

    Based ONLY on the provided list, find books that match the user's preference.
    
    If you find one or more suitable books, provide a structured JSON array of objects. Each object MUST have 'id', 'title', 'author', and 'summary' keys. The 'id' is the unique identifier from the provided list.
    
    If you cannot find any suitable books in the provided list, you MUST return an empty JSON array, like this: [].
    
    You MUST NOT return any books that are not in the provided list.
    You MUST NOT add any extra text, explanations, or code block delimiters.
    
    Example format for a successful match:
    [
      {
        "id": "-M-aBc123XyZ",
        "title": "Example Title 1",
        "author": "Example Author 1",
        "summary": "A brief summary of the book."
      }
    ]
    Example format if no match is found:
    []
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
