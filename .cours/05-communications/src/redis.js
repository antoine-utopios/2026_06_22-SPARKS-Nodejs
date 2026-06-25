import Redis from 'ioredis';

export const emetteur = new Redis()
export const auditeur = new Redis()