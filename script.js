function extractDriveId(url) {
  // Regex to match the ID from various Google Drive URL formats
  const regex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/drive\/folders\/|docs\.google\.com\/document\/d\/|sheets\.google\.com\/spreadsheets\/d\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null; // Return null if no ID is found
}

document.addEventListener("DOMContentLoaded", () => {
  // Get a reference to the grid container
  const featuredBooksGrid = document.getElementById('featured-book-grid');

  rootRef.once("value").then((snapshot) => {
    if (snapshot.exists()) {
      let maxFeaturedBooks = 3
      let currentBookNumber = 0
      snapshot.forEach(bookThing => {
        if (currentBookNumber < maxFeaturedBooks) {
          const book=bookThing.val()

          // Log both IDs for verification
          console.log("Cover ID:", book.coverLink, "PDF ID:", book.pdfLink);

          const bookItem = document.createElement("div")
          bookItem.setAttribute("class", "book-item")
          
          // Use the new book.coverId for the image src
          bookItem.innerHTML=`<img src="https://drive.google.com/thumbnail?id=${extractDriveId(book.coverLink)}&sz=w800" alt="${book.title}">`
          
          document.getElementById("featured-book-grid").appendChild(bookItem)
          currentBookNumber+=1
        }
        
      })
    }
  }).catch(error => {
    // A catch block to handle any errors during the data fetch
    console.error("Error fetching data:", error);
  });
})
