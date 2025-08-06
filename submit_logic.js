document.getElementById('sign_in_ui').style.display = 'none';
const title = document.getElementById("title");
const description = document.getElementById("description");
const coverFile = document.getElementById("cover-file"); // Correctly reference the new file input
const pdfLink = document.getElementById("pdf-link");
const form = document.getElementById("form");
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

  const file = coverFile.files[0];
  const pdfId = extractDriveId(pdfLink.value);

  if (!user) {
    alert("You must be signed in");
    return;
  } else if (!title.value || !file || !pdfId) {
    alert("Please provide all the details!");
    return;
  }

  const functionUrl = `https://.netlify.app/bookwyrmx.netlify/functions/upload`;

  const formData = new FormData();
  formData.append('coverImage', file);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const { coverUrl } = await response.json();

    const bookData = {
      title: title.value,
      description: description.value,
      coverUrl: coverUrl,
      pdfId: pdfId
    };

    await rootRef.push(bookData);
    alert("Book successfully published to BOOK WYRM!");
    form.reset();
  } catch (error) {
    console.error("Submission error:", error);
    alert("An error occurred: " + error.message);
  }
});

function extractDriveId(url) {
  const regex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/drive\/folders\/|docs\.google\.com\/document\/d\/|sheets\.google\.com\/spreadsheets\/d\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}
