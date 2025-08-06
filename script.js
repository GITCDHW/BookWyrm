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
