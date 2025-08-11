
if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }
  
  firebase.auth().signInWithEmailLink(email, window.location.href)
    .then((result) => {
      window.localStorage.removeItem('emailForSignIn');

      const bookId = window.localStorage.getItem('bookIdForRedirect');
      if (bookId) {
        window.localStorage.removeItem('bookIdForRedirect');

        window.location.href = `viewer.html?id=${bookId}`;
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
  function handleReadClick(bookId) {
    const user = firebase.auth().currentUser;
    if (user) {
      // User is signed in, redirect them
      window.location.href = `read.html?id=${bookId}`;
    } else {
      // User is not signed in. Store the ID and show the sign-in UI.
      alert("Please sign in to read this book.");
      document.querySelector(".container").style.display = "none"

      window.localStorage.setItem('bookIdForRedirect', bookId);
      startFirebaseUI("viewer.js");
    }
  }
  bookRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      const bookData = snapshot.val();
      document.getElementById("image").src = bookData.coverUrl;
      document.getElementById("title").innerHTML = bookData.title;
      
      const bookDescription = document.getElementById("description");
      bookDescription.innerHTML = bookData.description;
      
      document.querySelector(".read-button").onclick = function(){handleReadClick(id)};
      
      const toggleButton = document.getElementById('toggle-button');
      const descriptionContainer = document.querySelector('.description-container');
      
      if (bookDescription.scrollHeight > bookDescription.clientHeight) {
        toggleButton.style.display = 'block';
      } else {
        toggleButton.style.display = 'none';
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
