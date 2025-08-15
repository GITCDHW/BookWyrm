const form = document.getElementById("form");
const submitButton = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = firebase.auth().currentUser;

  if (!user) {
    alert("You must be signed in to submit a book.");
    // This function will display the FirebaseUI login flow
    startFirebaseUI("/submit.html"); 
    // The page to redirect to after successful sign-in
    return;
  }

  // Submission logic starts here, only if a user is found
  const title = document.getElementById("title");
  const description = document.getElementById("description");
  const genre = document.getElementById("genre"); // <-- Get the genre field
  const coverFile = document.getElementById("cover-file");
  const pdfFile = document.getElementById("pdf-file");
  const coverImageFile = coverFile.files[0];
  const pdfDocumentFile = pdfFile.files[0];

  if (!title.value || !description.value || !genre.value || !coverImageFile || !pdfDocumentFile) {
    alert("Please fill out all fields before submitting.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const functionUrl = `https://bookwyrmx.netlify.app/.netlify/functions/upload`;

  const formData = new FormData();
  formData.append('coverImage', coverImageFile);
  formData.append('pdfFile', pdfDocumentFile);
  

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData,
    });


    const responseData = await response.json();

    if (!response.ok) {
      
      throw new Error(responseData.error || 'Failed to upload files via Netlify function');
    }

    const { coverUrl, pdfUrl } = responseData;

    const bookData = {
      title: title.value,
      description: description.value,
      category: genre.value, // <-- Add the category to the bookData object
      coverUrl: coverUrl,
      pdfUrl: pdfUrl
    };

    await rootRef.push(bookData);
    alert("Book successfully published to BOOK WYRM!");
    form.reset();

  } catch (error) {
    alert("an error occurred")
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Book';
  }
});
