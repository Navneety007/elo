// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC6ReMDuuKpsmGeLkFvsBtkC7A2fb0zMRA",
    authDomain: "elorating-112e8.firebaseapp.com",
    projectId: "elorating-112e8",
    storageBucket: "elorating-112e8.firebasestorage.app",
    messagingSenderId: "990690767451",
    appId: "1:990690767451:web:08892270250219db43c57e",
    measurementId: "G-PLJ0FZ6XK4"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Function to add a question to the database
function addQuestion(question) {
    const questionsRef = firebase.database().ref('questions');
    questionsRef.push(question);
}

// Function to retrieve questions from the database
function getQuestions(callback) {
    const questionsRef = firebase.database().ref('questions');
    questionsRef.on('value', (snapshot) => {
        const questions = snapshot.val();
        callback(questions);
    });
}

// Function to retrieve leaderboard data
function getLeaderboard(callback) {
    const leaderboardRef = firebase.database().ref('leaderboard');
    leaderboardRef.on('value', (snapshot) => {
        const leaderboard = snapshot.val();
        callback(leaderboard);
    });
} 

export { addQuestion, getQuestions, getLeaderboard };