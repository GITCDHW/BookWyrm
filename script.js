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
  
  // use netlify function to suggest user books
const suggestionButton = document.getElementById("get-suggestion-button");
const preferences = document.getElementById("suggestion-input");

// New modal elements
const suggestionModal = document.getElementById("suggestion-modal");
const suggestionOutputPopup = document.getElementById("suggestion-output-popup");
const closeButton = document.querySelector(".close-button");

suggestionButton.addEventListener("click", async () => {
  const preference = preferences.value;
  if (preference.trim() === "") {
    suggestionOutputPopup.innerHTML = "Please tell me what books you like reading.";
    return;
  }
  
  // Show a loading state inside the pop-up
  suggestionOutputPopup.innerHTML = "Thinking...";
  suggestionModal.style.display = "block"; // Display the modal

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
    
    suggestionOutputPopup.innerHTML = ""; // Clear loading message
    const suggestionList = document.createElement("ul");
    suggestions.forEach(book => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<strong>${book.title}</strong> by ${book.author}: ${book.summary}`;
      suggestionList.appendChild(listItem);
    });
    suggestionOutputPopup.appendChild(suggestionList);

  } catch (e) {
    console.error("Front-end fetch error:", e);
    suggestionOutputPopup.innerHTML = "Got an unexpected error, please try again...";
  }
});

// Close the modal when the close button is clicked
closeButton.onclick = function() {
  suggestionModal.style.display = "none";
}

// Close the modal if the user clicks anywhere outside of the modal
window.onclick = function(event) {
  if (event.target == suggestionModal) {
    suggestionModal.style.display = "none";
  }
}

});
