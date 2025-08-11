document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      const userId = user.uid
      const userRef = db.ref(`users/${userId}`)
      
      const booksRef = db.ref("bookList")
      
      booksRef.once("value").then(allBookSnapshot=>{
        
        const bookList = allBookSnapshot.val()
        
        userRef.child("readingHistory").once("value").then((snapshot) => {
        if (snapshot.exists()) {
          const history = snapshot.val()
          Object.keys(history).forEach(id=>{
            const bookData=bookList[id]
            const bookItem = document.createElement("div")
            bookItem.setAttribute("class",".book-list-item")
            bookItem.innerHTML=`<img class="book-cover-small" src=${bookItem.coverUrl}>`
          })
        }
      })
      })
    } else {
      document.querySelector(".dashboard-container").style.display = "none"
      startFirebaseUI("dashboard.html")
    }
  })
})