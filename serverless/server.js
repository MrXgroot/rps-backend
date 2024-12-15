const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const rps = require("../engine/RpsEngine.js");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors());
app.use(express.json());
const games = {};
const getGameId = () => {
  return Date.now();
};

io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  socket.on("createRoom", () => {
    const gameId = getGameId();
    games[gameId] = { engine: new rps(), player1: socket.id, player2: null };
    socket.join(gameId);
    socket.emit("roomCreated", { gameId });
  });

  socket.on("joinRoom", (gameId) => {
    console.log(gameId);
    const game = games[gameId];
    if (!game) {
      socket.emit("error", "no such rooms");
      return;
    }
    if (game.player2 !== null) {
      socket.emit("error", "room full");
      return;
    }
    game.player2 = socket.id;
    socket.join(gameId);
    // console.log(game);
    if (game.player1 && game.player2) {
      io.to(gameId).emit("gameStarted", gameId);
    }
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("server is listening");
});
