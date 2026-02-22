import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yota';

let client;
let db;

async function connectDB() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    
    await createIndexes();
    await initializeData();
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('plugins').createIndex({ slug: 1 }, { unique: true });
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    await db.collection('threads').createIndex({ category_id: 1 });
    await db.collection('posts').createIndex({ thread_id: 1 });
    console.log('✅ Indexes created');
  } catch (error) {
    console.log('⚠️ Some indexes already exist');
  }
}

async function initializeData() {
  try {
    // Проверить есть ли админ
    const adminExists = await db.collection('users').findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('🔧 Creating default users...');
      const hashedPasswordAdmin = crypto.createHash('sha256').update('admin').digest('hex');
      const hashedPasswordKanekiq = crypto.createHash('sha256').update('kanekiq').digest('hex');
      
      await db.collection('users').insertMany([
        {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPasswordAdmin,
          role: 'admin',
          reputation: 0,
          badges: [],
          avatar: null,
          signature: '',
          banned: 0,
          username_shimmer: 0,
          username_shimmer_color1: '#4a9eff',
          username_shimmer_color2: '#f97316',
          username_verified: 0,
          created_at: new Date(),
          last_seen: new Date()
        },
        {
          username: 'kanekiq',
          email: 'kanekiq@example.com',
          password: hashedPasswordKanekiq,
          role: 'user',
          reputation: 100,
          badges: [],
          avatar: null,
          signature: '',
          banned: 0,
          username_shimmer: 0,
          username_shimmer_color1: '#4a9eff',
          username_shimmer_color2: '#f97316',
          username_verified: 0,
          created_at: new Date(),
          last_seen: new Date()
        }
      ]);
      
      console.log('✅ Users created (admin/admin, kanekiq/kanekiq)');
    }
    
    // Создать дефолтную категорию
    const categoryExists = await db.collection('categories').findOne();
    if (!categoryExists) {
      await db.collection('categories').insertOne({
        name: 'Общее обсуждение',
        slug: 'general',
        description: 'Общие темы и обсуждения',
        icon: '💬',
        created_at: new Date()
      });
      console.log('✅ Default category created');
    }
    
    // Создать настройки сайта
    const settingsExist = await db.collection('site_settings').findOne();
    if (!settingsExist) {
      await db.collection('site_settings').insertMany([
        { key: 'enableCaptcha', value: '1' },
        { key: 'registrationEnabled', value: '1' }
      ]);
      console.log('✅ Site settings created');
    }
  } catch (error) {
    console.log('⚠️ Some default data already exists');
  }
}

const dbAPI = {
  connect: connectDB,
  getDB: () => db,
  close: () => client?.close(),
  ObjectId
};

export default dbAPI;
