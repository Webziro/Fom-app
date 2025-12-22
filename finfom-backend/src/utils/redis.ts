import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379', // your Docker Redis URL
});

redisClient.on('error', err => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;