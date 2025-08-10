const urlparams = new URLSearchParams(window.location.search);
const id = urlparams.get('id');
const bookRef = rootRef.child(id);

if (id) {
  bookRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      const bookData = snapshot.val();
      document.getElementById("image").src = bookData.coverUrl;
      document.getElementById("title").innerHTML = bookData.title;
      
      // Corrected: The ID of the description paragraph is "description"
      const bookDescription = document.getElementById("description");
      bookDescription.innerHTML = bookData.description;
      
      document.querySelector(".read-button").href = `read.html?id=${id}`;
      
      // Now, perform the toggle logic after the description is loaded
      const toggleButton = document.getElementById('toggle-button');
      const descriptionContainer = document.querySelector('.description-container');
      
      // This check will now be accurate because the description is in the DOM
      if (bookDescription.scrollHeight > bookDescription.clientHeight) {
          toggleButton.style.display = 'block'; // Show the button if needed
      } else {
          toggleButton.style.display = 'none'; // Hide if not needed
      }
      
      toggleButton.addEventListener('click', function() {
          descriptionContainer.classList.toggle('expanded');
          if (descriptionContainer.classList.contains('expanded')) {
              toggleButton.textContent = 'Read less';
          } else {
              toggleButton.textContent = 'Read more';
          }
      });
      
    } else {
      console.log("Data not found");
    }
  });
}
