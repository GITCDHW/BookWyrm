// Add this new code block at the top of your file.
// This handles the email link sign-in process.
if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }
  
  firebase.auth().signInWithEmailLink(email, window.location.href)
    .then((result) => {
      window.localStorage.removeItem('emailForSignIn');
      // After successful sign-in, redirect to the reader page
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = urlParams.get('id');
      if (bookId) {
        window.location.href = `read.html?id=${bookId}`;
      } else {
        window.location.href = `index.html`;
      }
    })
    .catch((error) => {
      console.error("Error during sign-in with email link:", error);
      window.location.href = `index.html`;
    });
}
const urlparams = new URLSearchParams(window.location.search);
const id = urlparams.get('id');
const bookRef = rootRef.child(id);
if (id) {
  function handleReadClick(event, bookId) {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    if (user) {
      // User is signed in, redirect them
      window.location.href = `read.html?id=${bookId}`;
    } else {
      // User is not signed in. Show the sign-in UI.
      alert("Please sign in to read this book.");
      document.querySelector(".container").style.display = "none"
      startFirebaseUI("viewer.js");
    }
  }
  bookRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      const bookData = snapshot.val();
      document.getElementById("image").src = bookData.coverUrl;
      document.getElementById("title").innerHTML = bookData.title;
      
      // Corrected: The ID of the description paragraph is "description"
      const bookDescription = document.getElementById("description");
      bookDescription.innerHTML = bookData.description;
      
      document.querySelector(".read-button").onclick = handleReadClick;
      
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