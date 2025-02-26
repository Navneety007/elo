// main.js

// Initialize Firebase
const db = firebase.firestore();
let roomId = null;
const userId = getUserId();
let isHost = false;
let currentQuestionIndex = 0;
let questions = [];
let participants = [];

// DOM Elements
const sections = {
    welcome: document.getElementById('welcome-screen'),
    joinRoom: document.getElementById('join-room-screen'),
    hostSetup: document.getElementById('host-setup-screen'),
    voting: document.getElementById('voting-screen'),
    results: document.getElementById('results-screen'),
    waiting: document.getElementById('waiting-room')
};

// Helper function to show only one section
function showSection(sectionId) {
    Object.keys(sections).forEach(key => {
        sections[key].classList.remove('active');
    });
    sections[sectionId].classList.add('active');
}

// Event Listeners
document.getElementById('create-room-btn').addEventListener('click', createRoom);
document.getElementById('join-room-btn').addEventListener('click', () => showSection('joinRoom'));
document.getElementById('back-to-welcome').addEventListener('click', () => showSection('welcome'));
document.getElementById('join-room-submit').addEventListener('click', joinRoom);
document.getElementById('add-option-btn').addEventListener('click', addOptionInput);
document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('share-link').addEventListener('click', copyRoomLink);
document.getElementById('option1-btn').addEventListener('click', () => submitVote(0));
document.getElementById('option2-btn').addEventListener('click', () => submitVote(1));
document.getElementById('share-results-image').addEventListener('click', shareResultsAsImage);
document.getElementById('download-results-image').addEventListener('click', downloadResultsAsImage);
document.getElementById('new-game-button').addEventListener('click', resetGame);

// Generate unique IDs
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('userId', id);
    }
    return id;
}

// Room Creation
function createRoom() {
    roomId = generateRoomId();
    isHost = true;
    
    db.collection('rooms').doc(roomId).set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        status: 'setup'
    }).then(() => {
        document.getElementById('room-link').textContent = roomId;
        showSection('hostSetup');
    }).catch(error => {
        console.error('Error creating room: ', error);
        alert('Error creating room. Please try again.');
    });
}

// Join Room
function joinRoom() {
    const inputRoomId = document.getElementById('join-room-code').value.trim().toUpperCase();
    
    if (!inputRoomId) {
        alert('Please enter a room code');
        return;
    }
    
    roomId = inputRoomId;
    
    db.collection('rooms').doc(roomId).get().then(doc => {
        if (doc.exists) {
            const roomData = doc.data();
            isHost = roomData.createdBy === userId;
            
            // Add user to participants
            db.collection('rooms').doc(roomId).collection('participants').doc(userId).set({
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rating: 1000 // Initial ELO rating
            });
            
            // Determine where to direct the user
            if (roomData.status === 'setup') {
                if (isHost) {
                    document.getElementById('room-link').textContent = roomId;
                    showSection('hostSetup');
                } else {
                    showSection('waiting');
                    listenForGameStart();
                }
            } else if (roomData.status === 'active') {
                loadGameQuestions();
                showSection('voting');
            } else if (roomData.status === 'complete') {
                loadResults();
                showSection('results');
            }
        } else {
            alert('Room not found. Please check the room code and try again.');
        }
    }).catch(error => {
        console.error('Error joining room: ', error);
        alert('Error joining room. Please try again.');
    });
}

// Add option input field
function addOptionInput() {
    const optionsList = document.getElementById('options-list');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'option-input';
    newInput.placeholder = 'Enter participant name';
    optionsList.appendChild(newInput);
}

// Start Game
function startGame() {
    const questionText = document.getElementById('question-input').value.trim();
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(value => value); // Remove empty values
    
    if (!questionText) {
        alert('Please enter a question');
        return;
    }
    
    if (options.length < 2) {
        alert('Please enter at least 2 participants');
        return;
    }
    
    // Update room status
    db.collection('rooms').doc(roomId).update({
        status: 'active',
        question: questionText,
        participants: options,
        startedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        // Initialize participants with default ratings
        options.forEach(name => {
            db.collection('rooms').doc(roomId).collection('ratings').doc(name).set({
                name: name,
                rating: 1000
            });
        });
        
        // Generate all possible pairs for voting
        const pairs = generatePairs(options);
        db.collection('rooms').doc(roomId).update({
            pairs: pairs,
            currentPairIndex: 0,
            totalPairs: pairs.length
        }).then(() => {
            loadGameQuestions();
            showSection('voting');
        });
    }).catch(error => {
        console.error('Error starting game: ', error);
        alert('Error starting game. Please try again.');
    });
}

// Generate all possible pairs for comparison
function generatePairs(options) {
    const pairs = [];
    for (let i = 0; i < options.length; i++) {
        for (let j = i + 1; j < options.length; j++) {
            pairs.push([options[i], options[j]]);
        }
    }
    return pairs;
}

// Load Game Questions
function loadGameQuestions() {
    db.collection('rooms').doc(roomId).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            if (data.status === 'complete') {
                loadResults();
                showSection('results');
                return;
            }
            
            document.getElementById('current-question').textContent = data.question;
            
            if (data.pairs && data.currentPairIndex < data.pairs.length) {
                const currentPair = data.pairs[data.currentPairIndex];
                document.getElementById('option1-btn').textContent = currentPair[0];
                document.getElementById('option2-btn').textContent = currentPair[1];
                
                document.getElementById('voting-progress').textContent = 
                    `Question ${data.currentPairIndex + 1}/${data.totalPairs}`;
            }
        }
    });
}

// Submit Vote
function submitVote(choiceIndex) {
    db.collection('rooms').doc(roomId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const currentPair = data.pairs[data.currentPairIndex];
            const choice = currentPair[choiceIndex];
            const other = currentPair[choiceIndex === 0 ? 1 : 0];
            
            // Update ratings
            updateRatings(choice, other);
            
            // Move to next pair or finish
            if (data.currentPairIndex + 1 < data.totalPairs) {
                db.collection('rooms').doc(roomId).update({
                    currentPairIndex: data.currentPairIndex + 1
                });
            } else {
                // Game complete
                db.collection('rooms').doc(roomId).update({
                    status: 'complete',
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    loadResults();
                    showSection('results');
                });
            }
        }
    });
}

// Update ELO Ratings
function updateRatings(winner, loser) {
    db.collection('rooms').doc(roomId).collection('ratings').get().then(snapshot => {
        let winnerRating, loserRating;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name === winner) winnerRating = data;
            if (data.name === loser) loserRating = data;
        });
        
        if (winnerRating && loserRating) {
            const result = calculateEloRating(winnerRating.rating, loserRating.rating, 1, 0);
            
            db.collection('rooms').doc(roomId).collection('ratings').doc(winner).update({
                rating: result
            });
            
            db.collection('rooms').doc(roomId).collection('ratings').doc(loser).update({
                rating: loserRating.rating - (result - winnerRating.rating)
            });
        }
    });
}

// Calculate ELO Rating
function calculateEloRating(playerRating, opponentRating, score, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const newRating = Math.round(playerRating + kFactor * (score - expectedScore));
    return newRating;
}

// Load Results
function loadResults() {
    db.collection('rooms').doc(roomId).collection('ratings')
        .orderBy('rating', 'desc')
        .get()
        .then(snapshot => {
            const leaderboard = document.getElementById('leaderboard-list');
            leaderboard.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span>${data.name}</span> <span>${Math.round(data.rating)}</span>`;
                leaderboard.appendChild(listItem);
            });
        });
}

// Copy Room Link
function copyRoomLink() {
    navigator.clipboard.writeText(roomId).then(() => {
        alert('Room code copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy room code: ', err);
        // Fallback
        const roomLink = document.getElementById('room-link');
        roomLink.select();
        document.execCommand('copy');
        alert('Room code copied to clipboard!');
    });
}

// Listen for game start (for non-host participants)
function listenForGameStart() {
    db.collection('rooms').doc(roomId).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.status === 'active') {
                loadGameQuestions();
                showSection('voting');
            }
        }
    });
}

// Share results as image
function shareResultsAsImage() {
    html2canvas(document.getElementById('leaderboard-container')).then(canvas => {
        // Add branding
        const ctx = canvas.getContext('2d');
        ctx.font = '16px Exo 2';
        ctx.fillStyle = '#00ffff';
        ctx.fillText('ELO Rating Game - Compare Anything!', 20, canvas.height - 20);
        
        if (navigator.share) {
            canvas.toBlob(blob => {
                const file = new File([blob], 'elo-results.png', { type: 'image/png' });
                navigator.share({
                    title: 'My ELO Rating Results',
                    text: 'Check out my rankings!',
                    files: [file]
                }).catch(console.error);
            });
        } else {
            alert('Web Share API not supported. Use the download button instead.');
        }
    });
}

function downloadResultsAsImage() {
    html2canvas(document.getElementById('leaderboard-container')).then(canvas => {
        // Add branding to the canvas
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#00ffcc';
        ctx.fillText('EloRating Game - Compare Anything!', 10, canvas.height - 10);
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'elo-results.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function resetGame() {
    if (confirm('Are you sure you want to start a new game? This will create a new room.')) {
      // Generate new room ID
      roomId = generateRoomId();
      isHost = true;
      
      // Create new room in database
      db.collection('rooms').doc(roomId).set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        status: 'setup'
      }).then(() => {
        // Clear any previous data
        document.getElementById('room-link').textContent = roomId;
        document.getElementById('question-input').value = '';
        
        // Clear options except for the first two
        const optionsList = document.getElementById('options-list');
        while (optionsList.children.length > 2) {
          optionsList.removeChild(optionsList.lastChild);
        }
        
        // Reset option inputs
        const optionInputs = document.querySelectorAll('.option-input');
        optionInputs.forEach(input => input.value = '');
        
        showSection('hostSetup');
      }).catch(error => {
        console.error('Error creating new room: ', error);
      });
    }
  }
// Add this function before the setInterval call
function updateLeaderboard() {
    if (roomId && sections.results.classList.contains('active')) {
      loadResults();
    }
  }
// Call updateLeaderboard periodically or based on user actions
setInterval(updateLeaderboard, 5000);