document.addEventListener("DOMContentLoaded", () => {
  const featuredBooksGrid = document.getElementById('featured-book-grid');
  
  rootRef.once("value").then((snapshot) => {
    if (snapshot.exists()) {
      let maxFeaturedBooks = 3;
      let currentBookNumber = 0;
      
      snapshot.forEach(bookThing => {
        if (currentBookNumber < maxFeaturedBooks) {
          const book = bookThing.val();
          
          // Log the new data structure for verification
          console.log("Book Data:", book);
          
          const bookItem = document.createElement("div");
          bookItem.setAttribute("class", "book-item");
          
          // Use the direct coverUrl for the image source
          bookItem.innerHTML = `<a href="viewpdf.html?id=${bookThing.key}"><img src="${book.coverUrl}" alt="${book.title}"></a>`;
          
          featuredBooksGrid.appendChild(bookItem);
          currentBookNumber += 1;
        }
      });
    } else {
      console.log("No featured books found in the database.");
    }
  }).catch(error => {
    console.error("Error fetching data:", error);
  });
});

//use netlify function to suggest user books
const suggestionButton = document.getElementById("get-suggestion-button")
const preferences = document.getElementById("suggestion-input")
const suggestionReciever = document.getElementById("suggestion-output")

suggestionButton.addEventListener("click", async () => {
  const preference = preferences.value
  if (preference.trim() === "") {
    suggestionReciever.innerHTML = "please tell me what books do you like reading"
  }
  suggestionReciever.innerHTML = "thinking"
  try {
    const response = await fetch(
      "https://bookwyrmx.netlify.app/.netlify/functions/ai-suggester", {
        method: 'POST',
        headers: {
          'Content-type': "application/json"
        },
        body: JSON.stringify({ preference: preference }),
      })
    
    const suggestions = await response.json()
    
    if (response.ok) {
      suggestionReciever.innerHTML = ""
      
      suggestionList = document.createElement("ul")
      suggestions.forEach(book => {
        const listItem = document.createElement("li")
        listItem.innerHTML = `<strong>${book.title}</strong> by ${book.author}:${book.summary}`
        suggestionList.appendChild(listItem)
      })
      suggestionReciever.appendChild(suggestionList)
    }
    
  } catch (e) {
    console.error("error in netlify function:", e);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Error generating suggestions.' }),
    };
  }
})
