function calculateEloRating(playerRating, opponentRating, playerScore, opponentScore, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const newRating = playerRating + kFactor * (playerScore - expectedScore);
    return newRating;
}

function updateEloRatings(player1, player2, player1Score, player2Score) {
    const newPlayer1Rating = calculateEloRating(player1.rating, player2.rating, player1Score, player2Score);
    const newPlayer2Rating = calculateEloRating(player2.rating, player1.rating, player2Score, player1Score);
    
    player1.rating = newPlayer1Rating;
    player2.rating = newPlayer2Rating;

    return {
        player1: player1,
        player2: player2
    };
}

function getLeaderboard(players) {
    return players.sort((a, b) => b.rating - a.rating);
}