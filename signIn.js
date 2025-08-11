function startFirebaseUI(url) {
  // Configure FirebaseUI.
  var uiConfig = {
    signInSuccessUrl: url, 
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        return true;
      },
      uiShown: function() {
        console.log('FirebaseUI widget shown.');
      }
    },
    signInFlow: 'redirect',
    signInOptions: [{
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
      emailLinkSignIn: {
        url: "/viewer.html",
        handleCodeInApp: true
      }
    }],
    tosUrl: '/terms.html',
    privacyPolicyUrl: '/privacy-policy.html'
  };
  
  // Initialize the FirebaseUI Widget using Firebase.
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start('#firebaseui-auth-container', uiConfig);
}