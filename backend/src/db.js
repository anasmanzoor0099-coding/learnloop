import mongoose from 'mongoose';
import { ApiError } from './lib/api-error.js';

// Serverless functions can be reused between requests. Caching the connection
// prevents a new MongoDB pool from being created on every invocation.
const cache = globalThis.__learnloopMongoose || { conn: null, promise: null };
globalThis.__learnloopMongoose = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new ApiError(
      503,
      'The database is not configured. Add MONGODB_URI to your environment variables.'
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
