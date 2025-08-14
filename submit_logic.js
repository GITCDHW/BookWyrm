Form.addEventListener("submit", async (e) => {
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
  const coverFile = document.getElementById("cover-file");
  const pdfFile = document.getElementById("pdf-file");

  const coverImageFile = coverFile.files[0];
  const pdfDocumentFile = pdfFile.files[0];

  if (!title.value || !coverImageFile || !pdfDocumentFile) {
    alert("Please provide a title, cover image, and PDF file before submitting.");
    return;
  }

  alert("Validation passed. Starting submission process...");

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const functionUrl = `https://bookwyrmx.netlify.app/.netlify/functions/upload`;

  const formData = new FormData();
  formData.append('coverImage', coverImageFile);
  formData.append('pdfFile', pdfDocumentFile);

  try {
    alert("Sending request to Netlify function...");

    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData,
    });

    alert("Request sent. Awaiting response...");

    const responseData = await response.json();

    if (!response.ok) {
      alert("Server responded with an error. Status: " + response.status + ". Error: " + (responseData.details || responseData.error || 'Unknown error'));
      throw new Error(responseData.error || 'Failed to upload files via Netlify function');
    }

    const { coverUrl, pdfUrl } = responseData;

    alert("Files uploaded successfully! Cover URL: " + coverUrl + ", PDF URL: " + pdfUrl);

    const bookData = {
      title: title.value,
      description: description.value,
      coverUrl: coverUrl,
      pdfUrl: pdfUrl
    };

    await rootRef.push(bookData);
    alert("Book successfully published to BOOK WYRM!");
    form.reset();

  } catch (error) {
    console.error("Submission error:", error);
    alert("An error occurred: " + error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Book';
  }
});
