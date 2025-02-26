// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEJXhhKGUbIOLHpAWHHNh9cM45oY3YDQo",
  authDomain: "elorating-e076d.firebaseapp.com",
  projectId: "elorating-e076d",
  storageBucket: "elorating-e076d.firebasestorage.app",
  messagingSenderId: "971651588043",
  appId: "1:971651588043:web:2bcc9ca35b91028beba04e",
  measurementId: "G-1X4V59V0T0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize analytics if available
if (firebase.analytics) {
  const analytics = firebase.analytics();
}