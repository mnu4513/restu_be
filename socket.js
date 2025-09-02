let io;

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      socket.join(userId.toString()); // user-specific room
      console.log(`✅ User ${userId} joined room`);
    });

    // 👇 Admins join a shared room
    socket.on("joinAdmin", () => {
      socket.join("admins");
      console.log("👨‍💼 Admin joined admin room");
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
}

function emitOrderUpdate(userId, order) {
    console.log("📢 Sending update for order:", order._id);
  if (!io) return;
  io.to(userId.toString()).emit("orderUpdated", order); // send to user
  io.to("admins").emit("orderUpdated", order);          // send to admins
}

module.exports = { initSocket, emitOrderUpdate };
