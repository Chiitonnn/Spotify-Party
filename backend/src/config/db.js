 import { setServers } from 'node:dns';

// Force l'utilisation des DNS Google et Cloudflare   e
setServers(['8.8.8.8', '1.1.1.1']);

// Ensuite, ton code existant :
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};   