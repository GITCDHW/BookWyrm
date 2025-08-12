document.getElementById('sign_in_ui').style.display = 'none';
const title = document.getElementById("title");
const description = document.getElementById("description");
const coverFile = document.getElementById("cover-file");
const pdfFile = document.getElementById("pdf-file"); // New PDF file input
const form = document.getElementById("form");
const submitButton = document.querySelector(".submit-button");

var ui = new firebaseui.auth.AuthUI(auth);

var uiConfig = {
  signInSuccessUrl: "/submit.html",
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      console.log('User signed in:', authResult.user);
      return true;
    },
    uiShown: function() {
      console.log('FirebaseUI widget shown.');
    }
  },
  signInFlow: 'popup',
  signInOptions: [{
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
    emailLinkSignIn: {
      url: "/submit.html",
      handleCodeInApp: true
    }
  }],
  tosUrl: '/terms.html',
  privacyPolicyUrl: '/privacy-policy.html'
};

ui.start('#sign_in_ui', uiConfig);

auth.onAuthStateChanged(user => {
  if (user) {
    document.querySelector(".container").style.display = "block";
    document.querySelector("#sign_in_text").style.display = "none";
  } else {
    document.getElementById('sign_in_ui').style.display = 'block';
    document.querySelector(".container").style.display = "none";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let user = firebase.auth().currentUser;

  const coverImageFile = coverFile.files[0];
  const pdfDocumentFile = pdfFile.files[0]; // Get the PDF file

  if (!user) {
    alert("You must be signed in");
    return;
  } else if (!title.value || !coverImageFile || !pdfDocumentFile) {
    alert("Please provide all the details!");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const functionUrl = `https://bookwyrmx.netlify.app/.netlify/functions/upload`;

  const formData = new FormData();
  formData.append('coverImage', coverImageFile);
  formData.append('pdfFile', pdfDocumentFile); // Append the PDF file

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload files via Netlify function');
    }

    const { coverUrl, pdfUrl } = await response.json(); // Expect both URLs

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