// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6ReMDuuKpsmGeLkFvsBtkC7A2fb0zMRA",
  authDomain: "elorating-112e8.firebaseapp.com",
  projectId: "elorating-112e8",
  storageBucket: "elorating-112e8.firebasestorage.app",
  messagingSenderId: "990690767451",
  appId: "1:990690767451:web:08892270250219db43c57e",
  measurementId: "G-PLJ0FZ6XK4"
};

// Initialize Firebase with compat version
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();