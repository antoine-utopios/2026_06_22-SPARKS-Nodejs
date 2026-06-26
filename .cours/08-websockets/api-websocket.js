import express from 'express'
import { createServer } from 'node:http';
import { Server } from 'socket.io';


const app = express()
const httpServer = createServer(app);
const serverWebSocket = new Server(httpServer, { cors: { origin: '*' }})

serverWebSocket.of('/chat')
serverWebSocket.of('/notifications')

serverWebSocket.use((socket, next) => {
    const jwt = socket.handshake.auth.token

  try {
    await verifyToken(jwt)
    next()
  } catch (error) {
    next( new Error('Token invalide!'))
  }
})

serverWebSocket.on('connection', (socket) => {



  // Envoyer un message à tout le monde sauf l'utilisateur qui vient de se connecter
  socket.emit('newConnection', {
    username: 'John',
    message: 'John s\'est connecté'
  })
  
  // Envoyer un message à tout le monde sauf l'utilisateur qui vient de se connecter (version moderne)
  socket.broadcast.emit('newConnection', {
    username: 'John',
    message: 'John s\'est connecté'
  })
  
  // Envoyer un message à tout le monde y compris l'utilisateur qui vient de se connecter
  serverWebSocket.emit('newConnection', {
    username: 'John',
    message: 'John s\'est connecté'
  })
  
  socket.join('infos:generales')


  serverWebSocket.room('infos:generales').emit('newConnection', {
    username: 'John',
    message: 'John s\'est connecté au salon des infos générales'
  })
  
  socket.leave('infos:generales')

  serverWebSocket.room('infos:generales').emit('newConnection', {
    username: 'John',
    message: 'John s\'est déconnecté du salon des infos générales'
  })

  socket.on('message', (payload) => {
    socket.emit('message', payload);
  })

  socket.on('message:room', (payload) => {
    serverWebSocket.to(payload.room).emit('message', payload.message);
  })
})