import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { verifyToken } from "./tokens.js";

/**
 * SOLUTION du TP : chat complet Socket.IO.
 *
 * Fonctionnalites :
 *  - AUTH du handshake : un middleware io.use() lit le token dans
 *    socket.handshake.auth.token. Sans token valide -> connexion REFUSEE
 *    (le client recoit un "connect_error"). Avec token valide -> acceptee,
 *    et l'utilisateur est attache a socket.data.user.
 *  - NAMESPACE applicatif "/chat" (en plus du namespace par defaut).
 *  - ROOMS : join/leave + diffusion ciblee a une room.
 *  - EVENTS TYPES : contrat d'evenements clair (voir README) avec ACK.
 *  - SCALING multi-instances : si une fonction d'adaptateur est fournie
 *    (Redis), elle est branchee sur io.adapter() -> le broadcast traverse
 *    les instances via Redis Pub/Sub.
 *
 * @param {object} [options]
 * @param {(io: import('socket.io').Server) => Promise<void> | void} [options.attachAdapter]
 *        Fonction optionnelle qui branche un adaptateur (ex : Redis) sur l'io.
 * @returns {Promise<{ app, httpServer, io, chat }>}
 */
export async function createServer(options = {}) {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });

  // Branche l'adaptateur AVANT de servir (ex : Redis pour le scaling).
  if (typeof options.attachAdapter === "function") {
    await options.attachAdapter(io);
  }

  // Namespace applicatif dedie au chat.
  const chat = io.of("/chat");

  // --- Middleware d'AUTHENTIFICATION du handshake ---
  chat.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = verifyToken(token);
    if (!user) {
      // Rejette le handshake -> le client recoit "connect_error".
      return next(new Error("unauthorized"));
    }
    socket.data.user = user;
    next();
  });

  chat.on("connection", (socket) => {
    const user = socket.data.user;

    // EVENT TYPE : room:join { room } -> ACK { ok, room, user }
    socket.on("room:join", (payload, ack) => {
      const room = payload?.room;
      if (typeof room !== "string" || !room) {
        return ackSafe(ack, { ok: false, error: "room invalide" });
      }
      socket.join(room);
      ackSafe(ack, { ok: true, room, user: user.name });
    });

    // EVENT TYPE : room:leave { room } -> ACK { ok, room }
    socket.on("room:leave", (payload, ack) => {
      socket.leave(payload?.room);
      ackSafe(ack, { ok: true, room: payload?.room });
    });

    // EVENT TYPE : chat:send { room, text } -> diffuse "chat:message" a la room
    //              + ACK { ok, delivered }
    socket.on("chat:send", (payload, ack) => {
      const room = payload?.room;
      const text = payload?.text ?? "";
      if (typeof room !== "string" || !room) {
        return ackSafe(ack, { ok: false, error: "room manquante" });
      }
      // io.to(room) -> avec l'adaptateur Redis, atteint AUSSI les autres instances.
      chat.to(room).emit("chat:message", {
        room,
        text,
        from: user.name,
        at: Date.now(),
      });
      ackSafe(ack, { ok: true, delivered: true, room });
    });
  });

  function ackSafe(ack, value) {
    if (typeof ack === "function") ack(value);
  }

  return { app, httpServer, io, chat };
}

/**
 * Construit une fonction `attachAdapter` basee sur Redis (ioredis +
 * @socket.io/redis-adapter). Les clients Redis crees sont stockes pour
 * pouvoir etre fermes proprement.
 *
 * @param {string} redisUrl  ex: redis://localhost:6379
 * @returns {{ attach: (io: import('socket.io').Server) => Promise<void>, close: () => Promise<void> }}
 */
export function createRedisAdapterFactory(redisUrl) {
  const clients = [];
  return {
    async attach(io) {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();
      clients.push(pubClient, subClient);
      io.adapter(createAdapter(pubClient, subClient));
    },
    async close() {
      await Promise.all(clients.map((c) => c.quit().catch(() => {})));
    },
  };
}
