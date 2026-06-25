import express from "express";
import http from "node:http";
import { Server } from "socket.io";

/**
 * SOLUTION de l'exercice : gestion des ROOMS et des ACKNOWLEDGEMENTS.
 *
 * Comportements :
 *  - room:join  -> le socket rejoint une room ; ACK { ok, room, members }.
 *  - room:leave -> le socket quitte une room ; ACK { ok, room }.
 *  - room:message { room, text } -> le message est diffuse UNIQUEMENT aux
 *    membres de la room (io.to(room).emit), et un ACK confirme l'envoi a
 *    l'emetteur (callback cote serveur -> renvoye au client emetteur).
 *
 * Le ciblage par room garantit qu'un client hors de la room ne recoit PAS le message.
 *
 * @returns {{ app: import('express').Express, httpServer: import('http').Server, io: import('socket.io').Server }}
 */
export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    // Rejoindre une room. Le dernier argument est le callback d'acknowledgement.
    socket.on("room:join", (room, ack) => {
      if (typeof room !== "string" || room.length === 0) {
        return safeAck(ack, { ok: false, error: "room invalide" });
      }
      socket.join(room);
      const members = io.sockets.adapter.rooms.get(room)?.size ?? 0;
      // Confirmation au client emetteur via l'ACK.
      safeAck(ack, { ok: true, room, members });
    });

    // Quitter une room (avec ACK).
    socket.on("room:leave", (room, ack) => {
      socket.leave(room);
      safeAck(ack, { ok: true, room });
    });

    // Diffusion CIBLEE a une room + ACK de confirmation a l'emetteur.
    socket.on("room:message", (payload, ack) => {
      const room = payload?.room;
      const text = payload?.text ?? "";
      if (typeof room !== "string" || room.length === 0) {
        return safeAck(ack, { ok: false, error: "room manquante" });
      }
      const message = { room, text, from: socket.id, at: Date.now() };
      // Diffuse uniquement aux sockets presentes dans `room`.
      io.to(room).emit("room:message", message);
      // ACK : confirmation renvoyee au client emetteur seulement.
      safeAck(ack, { ok: true, delivered: true, room });
    });
  });

  /** Appelle le callback d'ACK seulement s'il a ete fourni par le client. */
  function safeAck(ack, value) {
    if (typeof ack === "function") ack(value);
  }

  return { app, httpServer, io };
}
