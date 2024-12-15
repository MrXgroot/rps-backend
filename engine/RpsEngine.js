class RpsEngine {
  constructor() {
    this.maxScore = 3;
    this.player1Score = 3;
    this.player2Score = 3;
    this.validChoices = ["rock", "paper", "scissor"];
  }

  getRandomChoice() {
    return this.validChoices[
      Math.floor(Math.random() * this.validChoices.length)
    ];
  }
  resetGame() {
    this.player1Score = 3;
    this.player2Score = 3;
  }
  validateRPS(player1Choice, player2Choice = null) {
    if (!player1Choice) return;
    player2Choice = player2Choice ? player2Choice : this.getRandomChoice();
    const result = {
      player: {
        player1: player1Choice,
        player2: player2Choice,
        playerScore: this.player1Score,
        opponentScore: this.player2Score,
      },
      opponent: {
        player1: player2Choice,
        player2: player1Choice,
        playerScore: this.player2Score,
        opponentScore: this.player1Score,
      },
    };

    if (player1Choice === player2Choice) {
      result.player.state = "tie";
      result.opponent.state = "tie";
    } else if (
      (player1Choice === "rock" && player2Choice === "scissor") ||
      (player1Choice === "paper" && player2Choice === "rock") ||
      (player1Choice === "scissor" && player2Choice === "paper")
    ) {
      result.player.state = "player1";
      result.opponent.state = "player2";
      this.player2Score--;
      result.player.opponentScore--;
      result.opponent.playerScore--;
    } else {
      result.player.state = "player2";
      result.opponent.state = "player1";
      this.player1Score--;
      result.player.playerScore--;
      result.opponent.opponentScore--;
    }
    if (result.player.playerScore == 0) {
      result.player.winner = "opponent";
      result.opponent.winner = "player";
    } else if (result.player.opponentScore == 0) {
      result.player.winner = "player";
      result.opponent.winner = "opponent";
    }
    return result;
  }
}

module.exports = RpsEngine;
