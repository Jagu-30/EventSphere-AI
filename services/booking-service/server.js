const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

// Setup HTTP & WebSocket Servers
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "running", service: "realtime-booking" }));
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup Redis Client
let useLocalBackup = false;
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: () => null // Do not keep retrying indefinitely
});

redis.on("connect", () => {
  console.log("Realtime: Connected to Redis successfully.");
  useLocalBackup = false;
});

redis.on("error", (err) => {
  console.warn("Realtime: Redis unavailable. Falling back to local in-memory lock engine.");
  useLocalBackup = true;
});

// Local Memory lock map: key -> { userId, expiresAt }
const localLocks = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join Event Room for real-time updates
  socket.on("join_show", (showId) => {
    socket.join(`show_${showId}`);
    console.log(`Socket ${socket.id} joined room show_${showId}`);
  });

  // Handle seat hold requests
  socket.on("hold_seat", async (data) => {
    const { showId, seatId, userId } = data;
    const lockKey = `lock:show_${showId}:seat_${seatId}`;
    
    let acquired = false;
    const expiresAt = Date.now() + 600 * 1000;

    if (useLocalBackup) {
      const current = localLocks.get(lockKey);
      if (!current || Date.now() > current.expiresAt) {
        localLocks.set(lockKey, { userId, expiresAt });
        acquired = true;
      }
    } else {
      try {
        const res = await redis.set(lockKey, userId, "NX", "EX", 600);
        acquired = (res === "OK" || res === true);
      } catch (err) {
        console.warn("Redis write failed, attempting local fallback...");
        localLocks.set(lockKey, { userId, expiresAt });
        acquired = true;
      }
    }
    
    if (acquired) {
      io.to(`show_${showId}`).emit("seat_held", {
        seatId,
        heldBy: userId,
        expiresAt
      });
      socket.emit("hold_success", { seatId });
    } else {
      socket.emit("hold_failed", { seatId, reason: "Seat is already held or booked." });
    }
  });

  // Handle seat release requests
  socket.on("release_seat", async (data) => {
    const { showId, seatId, userId } = data;
    const lockKey = `lock:show_${showId}:seat_${seatId}`;
    
    let released = false;

    if (useLocalBackup) {
      const current = localLocks.get(lockKey);
      if (current && String(current.userId) === String(userId)) {
        localLocks.delete(lockKey);
        released = true;
      }
    } else {
      try {
        const currentHolder = await redis.get(lockKey);
        if (currentHolder === String(userId)) {
          await redis.del(lockKey);
          released = true;
        }
      } catch (err) {
        // Fallback checks
        const current = localLocks.get(lockKey);
        if (current && String(current.userId) === String(userId)) {
          localLocks.delete(lockKey);
          released = true;
        }
      }
    }

    if (released) {
      io.to(`show_${showId}`).emit("seat_released", { seatId });
      socket.emit("release_success", { seatId });
    } else {
      socket.emit("release_failed", { seatId, reason: "You do not own the hold on this seat." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Realtime Socket.IO server running on port ${PORT}`);
});
