const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const rps = require("./engine/RpsEngine.js");
const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://localhost:5173"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
const games = {};
const players = [];
const getGameId = () => {
  return "" + Date.now();
};

io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  socket.on("createRoom", () => {
    const gameId = getGameId();
    console.log(gameId);
    if (socket.gameId) return;
    games[gameId] = {
      engine: new rps(),
      player1: socket,
      player2: null,
      player1Choice: null,
      player2Choice: null,
    };
    socket.join(gameId);
    socket.gameId = gameId;
    socket.role = "player1";
    socket.emit("roomCreated", { gameId });
    console.log("room created with id", gameId);
  });

  socket.on("joinRoom", (gameId) => {
    console.log("join request", gameId);
    const game = games[gameId];
    if (!game) {
      socket.emit("error", "no such rooms");
      return;
    }
    if (game.player1 && game.player1.id === socket.id) return;
    if (game.player2 !== null) {
      socket.emit("error", "room full");
      return;
    }
    game.player2 = socket;
    socket.gameId = gameId;
    socket.role = "player2";
    socket.join(gameId);
    if (game.player1 && game.player2) {
      io.to(gameId).emit("gameStarted", gameId);
    }
  });

  socket.on("joinRandom", () => {
    if (players.includes(socket)) return;
    if (socket.gameId) socket.leave(socket.gameId);
    console.log("join random");
    if (players.length > 0) {
      const player1 = players.shift();
      if (!player1.connected) return;
      const player2 = socket;
      const gameId = getGameId();
      games[gameId] = {
        engine: new rps(),
        player1,
        player2,
        player1Choice: null,
        player2Choice: null,
      };
      player1.gameId = gameId;
      player2.gameId = gameId;
      player1.join(gameId);
      player2.join(gameId);
      io.to(gameId).emit("resetGame");
      io.to(gameId).emit("gameStarted");
    } else {
      players.push(socket);
    }
  });

  socket.on("playAgain", () => {
    console.log(socket.id);
    const game = games[socket.gameId];
    if (!game) return;
    socket.playAgain = true;
    const { player1, player2 } = game;
    if (player1.playAgain && player2.playAgain) {
      game.engine.resetGame();
      io.to(socket.gameId).emit("resetGame");
      player1.playAgain = false;
      player2.playAgain = false;
    }
  });

  socket.on("validateRps", (playerChoice, callBack) => {
    const gameId = socket.gameId;
    const game = games[gameId];

    if (!game) return;

    if (socket === game.player1) {
      game.player1Choice = playerChoice;
    } else if (socket === game.player2) {
      game.player2Choice = playerChoice;
    } else {
      return;
    }

    if (game.player1Choice != null && game.player2Choice != null) {
      const result = game.engine.validateRPS(
        game.player1Choice,
        game.player2Choice
      );

      game.player1.emit("validateSuccessfull", result.player);
      game.player2.emit("validateSuccessfull", result.opponent);

      game.player1Choice = null;
      game.player2Choice = null;
    }
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    const gameId = socket.gameId;
    //managing if in game leave
    if (!gameId || !games[gameId]) return;
    io.to(socket.gameId).emit("disconnected");
    delete games[gameId];

    //managing the players queue
    const index = players.indexOf(socket);
    if (index > -1) players.splice(index, 1);
  });
});

const PORT = process.env.PORT || 4829;
server.listen(PORT, () => {
  console.log("server is listening");
});
