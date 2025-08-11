document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userId = user.uid; // Correct: user.uid
      const userRef = firebase.database().ref(`users/${userId}`);
      userRef.once("value").then(snapshot=>{
        const userData = snapshot.val()
        const email = userData.email
        document.getElementById("welcome-message").innerHTML=`hello,${email.split("@")[0]}`
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
      });
    } else {
      document.querySelector(".dashboard-container").style.display = "none";
      // Assuming startFirebaseUI is a function that takes a URL
      startFirebaseUI("/user_dashboard.html"); 
    }
  });
});
