const firebaseConfig = {
    apiKey: "AIzaSyBZWsblAiu4XpNYGQ-E0VVOC5f-273n75E",
    authDomain: "bookwyrm-9fbfd.firebaseapp.com",
    projectId: "bookwyrm-9fbfd",
    storageBucket: "bookwyrm-9fbfd.firebasestorage.app",
    messagingSenderId: "718138987612",
    appId: "1:718138987612:web:f691b54829239a660d4299"
  };
const app = firebase.initializeApp(firebaseConfig);
const db=firebase.database()
const rootRef = db.ref("bookList")
const auth = firebase.auth()