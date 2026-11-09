import mongoose from 'mongoose';
export async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing from backend/.env');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 7000 });
  console.log('MongoDB connected:', mongoose.connection.name);
}
