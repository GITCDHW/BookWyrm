document.getElementById('sign_in_ui').style.display = 'none';
const title = document.getElementById("title")
const description = document.getElementById("description")
const coverLink= document.getElementById("cover-link") // New line to get the cover link
const pdfLink = document.getElementById("pdf-link")
const form = document.getElementById("form")
var ui = new firebaseui.auth.AuthUI(auth);

var uiConfig = {
  signInSuccessUrl:"/submit.html",
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


auth.onAuthStateChanged(user=>{
  if (user) {
     document.querySelector(".container").style.display="block"
     document.querySelector("#sign_in_text").style.display="none"
  } else {
    document.getElementById('sign_in_ui').style.display = 'block';
    document.querySelector(".container").style.display="none"
  }
})

form.addEventListener("submit",(e)=>{
  let user = firebase.auth().currentUser;
  e.preventDefault();
  bookData={
    title:title.value,
    description: description.value,
    coverLink: coverLink.value, // Updated bookData to include the coverId
    pdfLink:pdfLink.value
  }
  if (!user) {
    alert("you must be signed in")
  } else if (!title.value || !coverLink.value || !pdfLink.value) { // Updated validation
    alert("please provide all the details!")
  }
  rootRef.push(bookData).then(()=>{alert("book successfuly published to bookwyrm")}).catch(error=>{
    alert(error)
  })
})
