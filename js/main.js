// main.js

const db = firebase.firestore();
const roomId = generateRoomId();
const userId = getUserId();

document.getElementById('add-question-form').addEventListener('submit', addQuestion);
document.getElementById('share-link').addEventListener('click', shareRoomLink);
document.getElementById('share-results-image').addEventListener('click', shareResultsAsImage);
document.getElementById('download-results-image').addEventListener('click', downloadResultsAsImage);
document.getElementById('new-game-button').addEventListener('click', startNewGame);

function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

function getUserId() {
    return localStorage.getItem('userId') || Math.random().toString(36).substr(2, 9);
}

function addQuestion(event) {
    event.preventDefault();
    const questionText = document.getElementById('question-input').value;
    const options = Array.from(document.querySelectorAll('.option-input')).map(input => input.value);
    
    if (questionText && options.length) {
        db.collection('rooms').doc(roomId).collection('questions').add({
            question: questionText,
            options: options,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById('question-input').value = '';
            document.querySelectorAll('.option-input').forEach(input => input.value = '');
            alert('Question added successfully!');
        }).catch(error => {
            console.error('Error adding question: ', error);
        });
    } else {
        alert('Please fill in the question and options.');
    }
}

function shareRoomLink() {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Room link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

function updateLeaderboard() {
    db.collection('rooms').doc(roomId).collection('users').orderBy('rating', 'desc').get().then(snapshot => {
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const listItem = document.createElement('li');
            listItem.textContent = `${user.name}: ${user.rating}`;
            leaderboard.appendChild(listItem);
        });
    });
}

function shareResultsAsImage() {
    // Convert the leaderboard to an image using html2canvas
    html2canvas(document.getElementById('leaderboard-container')).then(canvas => {
        // Add branding to the canvas
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#00ffcc';
        ctx.fillText('EloRating Game - Compare Anything!', 10, canvas.height - 10);
        
        // Share the image if Web Share API is available
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
            alert('Web Share API not supported in your browser. Use the download button instead.');
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

function startNewGame() {
    if (confirm('Are you sure you want to start a new game? This will create a new room.')) {
        // Generate new room ID
        const newRoomId = generateRoomId();
        
        // Create new room in database
        db.collection('rooms').doc(newRoomId).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: userId
        }).then(() => {
            // Redirect to the new room
            window.location.href = `${window.location.origin}/room/${newRoomId}`;
        }).catch(error => {
            console.error('Error creating new room: ', error);
        });
    }
}

// Call updateLeaderboard periodically or based on user actions
setInterval(updateLeaderboard, 5000);