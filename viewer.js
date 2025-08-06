const urlparams=new URLSearchParams(window.location.search)
const id=urlparams.get('id')
const bookRef=rootRef.child(id)
if (id) {
  bookRef.once("value").then(snapshot=>{
  if (snapshot.exists()) {
    bookData=snapshot.val()
    document.getElementById("image").src=bookData.coverUrl
    document.getElementById("title").innerHTML=bookData.title
    document.getElementById("description").innerHTML=bookData.description
    document.querySelector(".read-button").href=`https://drive.google.com/uc?id=${bookData.pdfId}&export=download`
  }else{
    console.log("data not found")
  }
})
}
