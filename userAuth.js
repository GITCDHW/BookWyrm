// userAuth.js
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const userRef = firebase.database().ref(`users/${user.uid}`);
    userRef.once('value').then(snapshot => {
      if (!snapshot.exists()) {
        userRef.set({
          email: user.email,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
    });
  }
});
