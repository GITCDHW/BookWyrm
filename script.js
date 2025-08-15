document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("wrapper")
  const loader = document.getElementById("load-container")

  const featuredBooksGrid = document.getElementById('featured-book-grid');
  const scienceBooksGrid = document.getElementById('science-book-grid');
  const philosophyBooksGrid = document.getElementById('philosophy-book-grid');
  
  rootRef.once("value").then((snapshot) => {
    if (snapshot.exists()) {
      const allBooks = snapshot.val();
      const booksArray = Object.entries(allBooks);
      
      const scienceBooks = [];
      const philosophyBooks = [];
      
      booksArray.forEach(([bookId, book]) => {
        const category = book.Category;
        
        if (category === "Science") {
          scienceBooks.push({ id: bookId, ...book });
        } else if (category === "Philosophy") {
          philosophyBooks.push({ id: bookId, ...book });
        }
      });
      console.log(scienceBooks)
      console.log(philosophyBooks)
      // Render Featured books (first 3 from the database)
      const maxFeaturedBooks = 3;
      booksArray.slice(0, maxFeaturedBooks).forEach(([bookId, book]) => {
        const featuredBookItem = document.createElement("div");
        featuredBookItem.setAttribute("class", "book-item");
        featuredBookItem.innerHTML = `<a href="viewer.html?id=${bookId}"><img src="${book.coverUrl}" alt="${book.title}"></a>`;
        featuredBooksGrid.appendChild(featuredBookItem);
      });
      
      const maxCategoryBooks = 12; 
      // Render Science books
      scienceBooks.slice(0, maxCategoryBooks).forEach(book => {
        const scienceBookItem = document.createElement("div");
        scienceBookItem.setAttribute("class", "book-item");
        scienceBookItem.innerHTML = `<a href="viewer.html?id=${book.id}"><img src="${book.coverUrl}" alt="${book.title}"></a>`;
        scienceBooksGrid.appendChild(scienceBookItem);
      });
      
      // Render Philosophy books
      philosophyBooks.slice(0, maxCategoryBooks).forEach(book => {
        const philosophyBookItem = document.createElement("div");
        philosophyBookItem.setAttribute("class", "book-item");
        philosophyBookItem.innerHTML = `<a href="viewer.html?id=${book.id}"><img src="${book.coverUrl}" alt="${book.title}"></a>`;
        philosophyBooksGrid.appendChild(philosophyBookItem);
      });
    } else {
      console.log("No books found in the database.");
    }
    setTimeout(() => {
      wrapper.style.display = "block"
      loader.style.display = "none"
    }, 100)
  }).catch(error => {
    console.error("Error fetching data:", error);
  });
  
  // use netlify function to suggest user books
  const suggestionButton = document.getElementById("get-suggestion-button");
  const preferences = document.getElementById("suggestion-input");
  
  const suggestionModal = document.getElementById("suggestion-modal");
  const suggestionOutputPopup = document.getElementById("suggestion-output-popup");
  const closeButton = document.querySelector(".close-button");
  
  suggestionButton.addEventListener("click", async () => {
    const preference = preferences.value;
    if (preference.trim() === "") {
      suggestionOutputPopup.innerHTML = "Please tell me what books you like reading.";
      suggestionModal.style.display = "block";
      return;
    }
    
    suggestionOutputPopup.innerHTML = "Thinking...";
    suggestionModal.style.display = "block";
    
    try {
      const response = await fetch(
        "https://bookwyrmx.netlify.app/.netlify/functions/ai-suggester", {
          method: 'POST',
          headers: {
            'Content-type': "application/json",
          },
          body: JSON.stringify({ preference: preference }),
        });
      
      if (!response.ok) {
        const errorData = await response.json();
        suggestionOutputPopup.innerHTML = `Error: ${errorData.message}`;
        return;
      }
      
      const suggestions = await response.json();
      
      suggestionOutputPopup.innerHTML = "";
      if (suggestions.length === 0) {
        suggestionOutputPopup.innerHTML = "Sorry, no books matching your preference were found.";
      } else {
        const suggestionList = document.createElement("ul");
        suggestions.forEach(book => {
          const listItem = document.createElement("li");
          listItem.innerHTML = `<strong><a href="viewer.html?id=${book.id}">${book.title}</a></strong> by ${book.author}: ${book.summary}`;
          suggestionList.appendChild(listItem);
        });
        suggestionOutputPopup.appendChild(suggestionList);
      }
      
    } catch (e) {
      console.error("Front-end fetch error:", e);
      suggestionOutputPopup.innerHTML = "Got an unexpected error, please try again...";
    }
  });
  
  closeButton.onclick = function() {
    suggestionModal.style.display = "none";
  }
  
  window.onclick = function(event) {
    if (event.target == suggestionModal) {
      suggestionModal.style.display = "none";
    }
  }
});
