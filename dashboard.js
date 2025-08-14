document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("load-container")
  const wrapper = document.getElementById("dashboard-container")
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userId = user.uid; // Correct: user.uid
      const userRef = firebase.database().ref(`users/${userId}`);
      userRef.once("value").then(snapshot => {
        const userData = snapshot.val()
        const email = userData.email
        document.getElementById("welcome-message").innerHTML = `hello,${email.split("@")[0]}`
      })
      const booksRef = firebase.database().ref("bookList");
      
      booksRef.once("value").then(allBookSnapshot => {
        const bookList = allBookSnapshot.val();
        
        // Fetch user's reading history, ordered by timestamp
        userRef.child("readingHistory").orderByChild('timestamp').once("value").then((historySnapshot) => {
          if (historySnapshot.exists()) {
            const readingHistoryList = document.getElementById("reading-history-list");
            const historyData = historySnapshot.val();
            
            let isFirst = true; // Flag for the "Continue Reading" section
            
            // Use Object.keys to iterate over the history object
            Object.keys(historyData).reverse().forEach(bookId => { // Reverse to get most recent first
              const bookData = bookList[bookId];
              const lastReadPage = historyData[bookId].lastReadPage;
              
              if (bookData) {
                // Logic for "Continue Reading" section (only the most recent book)
                if (isFirst) {
                  document.getElementById('continue-cover').src = bookData.coverUrl;
                  document.getElementById('continue-title').textContent = bookData.title;
                  document.getElementById('continue-page').textContent = `Last read: Page ${lastReadPage}`;
                  document.getElementById('continue-button').onclick = () => {
                    window.location.href = `read.html?id=${bookId}`;
                  };
                  document.getElementById('continue-reading-card').style.display = 'flex';
                  isFirst = false;
                }
                
                // Logic for the reading history list
                const listItem = document.createElement("a");
                listItem.classList.add("book-list-item");
                listItem.href = `read.html?id=${bookId}`;
                listItem.innerHTML = `
                        <img class="book-cover-small" src="${bookData.coverUrl}">
                        <div class="list-item-content">
                            <h4>${bookData.title}</h4>
                            <p>Last read: Page ${lastReadPage}</p>
                        </div>
                    `;
                readingHistoryList.appendChild(listItem);
              }
            });
          }
        });
        
        setTimeout(() => {
          wrapper.style.display = "block"
          loader.style.display = "none"
        }, 100)
      });
    } else {
      document.querySelector(".dashboard-container").style.display = "none";
      startFirebaseUI("/user_dashboard.html");
    }
  });
});

//AI suggestion
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
        listItem.innerHTML = `<strong><a href="viewpdf.html?id=${book.id}">${book.title}</a></strong> by ${book.author}: ${book.summary}`;
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