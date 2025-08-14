form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let user = firebase.auth().currentUser;

  const coverImageFile = coverFile.files[0];
  const pdfDocumentFile = pdfFile.files[0]; // Get the PDF file

  if (!user) {
    alert("You must be signed in to submit a book.");
    document.getElementById("sign_in_text").style.display="block";
    return;
  } else if (!title.value || !coverImageFile || !pdfDocumentFile) {
    alert("Please provide a title, cover image, and PDF file before submitting.");
    return;
  }
  
  alert("Validation passed. Starting submission process..."); // Debugging alert

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const functionUrl = `https://bookwyrmx.netlify.app/.netlify/functions/upload`;

  const formData = new FormData();
  formData.append('coverImage', coverImageFile);
  formData.append('pdfFile', pdfDocumentFile); // Append the PDF file

  try {
    alert("Sending request to Netlify function..."); // Debugging alert

    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData,
    });
    
    alert("Request sent. Awaiting response..."); // Debugging alert

    // Read the JSON response body once and store it
    const responseData = await response.json();
    
    if (!response.ok) {
      alert("Server responded with an error. Status: " + response.status + ". Error: " + (responseData.details || responseData.error || 'Unknown error'));
      throw new Error(responseData.error || 'Failed to upload files via Netlify function');
    }

    // Use the data from the single response body for success
    const { coverUrl, pdfUrl } = responseData;
    
    alert("Files uploaded successfully! Cover URL: " + coverUrl + ", PDF URL: " + pdfUrl); // Debugging alert

    const bookData = {
      title: title.value,
      description: description.value,
      coverUrl: coverUrl,
      pdfUrl: pdfUrl // Store the new PDF URL
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
