document.addEventListener("DOMContentLoaded",()=>{
  auth.onAuthStateChanged(user=>{
    if (user) {
      const userId = user.id
      const userRef=db.ref(`users/${userId}`)
      userRef.child("readingHistory").once("value").then((snapshot)=>{
        if (snapshot.exists()) {
          const history = snapshot.val()
          console.log(history)
        }
      })
    } else {
      document.querySelector(".dashboard-container").style.display="none"
      startFirebaseUI()
    }
  })
})