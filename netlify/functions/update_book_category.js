const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_API_KEY;
const genAi = new GoogleGenerativeAI(api_key);

const admin = require("firebase-admin");

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
} catch (e) {
    console.error("Failed to parse Firebase service account JSON at module load time:", e);
}

const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

// This function must be async because it uses await
const getDataFromGemini = async (book) => {
    const prompt = `You are a helpful assistant for categorizing books.
Based on the provided book description, identify the single most relevant genre or category from the following list:
- History
- Philosophy
- Science
- Self-Help
- Biography
- Fiction
- Other
Book Description:
"${book.description}"
Respond with ONLY the single category name, no extra text, no quotes, and no punctuation.`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.trim();
        return cleanText;
    } catch (e) {
        console.error("Error in communication with gemini:", e);
        // Return a default category on failure to prevent the promise from hanging
        return "Other";
    }
};

// This function must be async because it uses await
exports.handler = async (event, context) => {
    // Initialization should be done here for every invocation
    const initFirebase = () => {
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: "https://bookwyrm-9fbfd-default-rtdb.firebaseio.com"
                });
            } catch (e) {
                console.error("error initialising firebase", e);
            }
        }
    };
    
    // Call the initialization function
    initFirebase();
    
    const updates = {};
    const bookPromises = [];
    
    const db = admin.database();
    const booksRef = db.ref("bookList");
    const res = await booksRef.once("value");
    const booksData = res.val();

    // The for...in loop is correct for iterating over an object
    for (const bookId in booksData) {
        const book = booksData[bookId];
        // Check if the book needs categorization
        if (!book.category) {
            // Push the promise directly into the array
            const promise = getDataFromGemini(book).then(category => {
                updates[`${bookId}/category`] = category;
            });
            bookPromises.push(promise);
        }
    }
    
    // Wait for all promises to resolve
    await Promise.all(bookPromises);
    
    // Check if there are any updates to perform
    if (Object.keys(updates).length > 0) {
        await booksRef.update(updates);
        console.log("updates successful");
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "successful updates of firebase" })
    };
};
