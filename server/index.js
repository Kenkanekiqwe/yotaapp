import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dbAPI from './db.js';

const { ObjectId } = dbAPI;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const captchaStore = new Map();
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
let db;
let dbReady = false;

// Инициализация БД
(async () => {
  try {
    db = await dbAPI.connect();
    dbReady = true;
    console.log('✅ Server ready');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
})();

function cleanCaptchaExpired() {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expires < now) captchaStore.delete(id);
  }
}

async function getSetting(key, def = '0') {
  try {
    const setting = await db.collection('site_settings').findOne({ key });
    return setting ? setting.value : def;
  } catch (e) {
    return def;
  }
}

async function isUserBanned(userId) {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user && user.banned === 1;
  } catch (e) {
    return false;
  }
}

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));

// Установка правильной кодировки для всех ответов
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middleware для проверки подключения к БД
app.use((req, res, next) => {
  if (!dbReady && !req.path.includes('/health')) {
    return res.status(503).json({ error: 'Database not ready yet, please wait...' });
  }
  next();
});

// Здоровье сервера
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API для плагинов
app.get('/api/plugins', async (req, res) => {
  try {
    const { search } = req.query;
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          author_name: { $ifNull: ['$author.username', 'Unknown'] }
        }
      },
      { $project: { author: 0 } }
    ];

    if (search) {
      pipeline.unshift({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const plugins = await db.collection('plugins').aggregate(pipeline).toArray();
    res.json(plugins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/plugins/:slug', async (req, res) => {
  try {
    const plugin = await db.collection('plugins').findOne({ slug: req.params.slug });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

    const author = await db.collection('users').findOne({ _id: plugin.author_id });
    res.json({
      ...plugin,
      id: plugin._id,
      author_name: author?.username || 'Unknown',
      author_id: plugin.author_id,
      reviews: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plugins', async (req, res) => {
  try {
    const { name, slug, description, full_description, version, price, file_url, image_url, userId } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'Требуется авторизация и название плагина' });
    }
    if (await isUserBanned(userId)) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const s = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'plugin';
    const existing = await db.collection('plugins').findOne({ slug: s });
    if (existing) return res.status(400).json({ error: 'Плагин с таким slug уже существует' });

    const result = await db.collection('plugins').insertOne({
      name,
      slug: s,
      description: description || '',
      full_description: full_description || '',
      author_id: new ObjectId(userId),
      version: version || '1.0',
      price: price || 0,
      file_url: file_url || '',
      image_url: image_url || '',
      created_at: new Date()
    });

    res.json({ success: true, id: result.insertedId, slug: s });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для форума
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.collection('categories').find().toArray();
    
    for (const cat of categories) {
      cat.id = cat._id;
      const threads = await db.collection('threads').find({ category_id: cat._id }).toArray();
      cat.thread_count = threads.length;
      
      const threadIds = threads.map(t => t._id);
      cat.post_count = threadIds.length > 0 
        ? await db.collection('posts').countDocuments({ thread_id: { $in: threadIds } })
        : 0;
    }

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/threads', async (req, res) => {
  try {
    const { category } = req.query;
    let match = {};

    if (category) {
      const cat = await db.collection('categories').findOne({ slug: category });
      if (cat) match.category_id = cat._id;
    }

    const threads = await db.collection('threads').aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          author_name: { $ifNull: ['$author.username', 'Unknown'] },
          author_avatar: '$author.avatar',
          author_name_shimmer: { $ifNull: ['$author.username_shimmer', 0] },
          author_name_shimmer_color1: { $ifNull: ['$author.username_shimmer_color1', '#4a9eff'] },
          author_name_shimmer_color2: { $ifNull: ['$author.username_shimmer_color2', '#f97316'] },
          author_name_verified: { $ifNull: ['$author.username_verified', 0] }
        }
      },
      { $project: { author: 0 } },
      { $sort: { pinned: -1, updated_at: -1 } }
    ]).toArray();

    // Добавить счётчики и теги
    for (const thread of threads) {
      thread.reply_count = await db.collection('posts').countDocuments({ thread_id: thread._id });
      
      const lastPost = await db.collection('posts')
        .find({ thread_id: thread._id })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();
      thread.last_post_time = lastPost[0]?.created_at || null;

      const threadTags = await db.collection('thread_tags').find({ thread_id: thread._id }).toArray();
      if (threadTags.length > 0) {
        const tagIds = threadTags.map(tt => tt.tag_id);
        const tags = await db.collection('tags').find({ _id: { $in: tagIds } }).toArray();
        thread.tags = tags.map(t => t.name).join(',');
      } else {
        thread.tags = '';
      }
    }

    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/threads/:id', async (req, res) => {
  try {
    const viewerKey = req.query.viewerKey || `anon:${req.ip}:${(req.get('user-agent') || '').slice(0, 80)}`;
    const threadId = new ObjectId(req.params.id);

    const threads = await db.collection('threads').aggregate([
      { $match: { _id: threadId } },
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          author_name: { $ifNull: ['$author.username', 'Unknown'] },
          author_avatar: '$author.avatar',
          badges: { $ifNull: ['$author.badges', []] },
          author_name_shimmer: { $ifNull: ['$author.username_shimmer', 0] },
          author_name_shimmer_color1: { $ifNull: ['$author.username_shimmer_color1', '#4a9eff'] },
          author_name_shimmer_color2: { $ifNull: ['$author.username_shimmer_color2', '#f97316'] },
          author_name_verified: { $ifNull: ['$author.username_verified', 0] },
          category_name: { $ifNull: ['$category.name', 'Unknown'] },
          category_slug: { $ifNull: ['$category.slug', 'general'] }
        }
      },
      { $project: { author: 0, category: 0 } }
    ]).toArray();

    if (threads.length === 0) return res.status(404).json({ error: 'Thread not found' });
    const thread = threads[0];

    // Учёт просмотра
    try {
      await db.collection('thread_views').updateOne(
        { thread_id: threadId, viewer_key: viewerKey },
        { $setOnInsert: { thread_id: threadId, viewer_key: viewerKey, created_at: new Date() } },
        { upsert: true }
      );
      await db.collection('threads').updateOne({ _id: threadId }, { $inc: { views: 1 } });
      thread.views = (thread.views || 0) + 1;
    } catch (e) {}

    // Получить посты
    let posts = await db.collection('posts').aggregate([
      { $match: { thread_id: threadId } },
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          username: { $ifNull: ['$user.username', 'Unknown'] },
          avatar: '$user.avatar',
          reputation: { $ifNull: ['$user.reputation', 0] },
          badges: { $ifNull: ['$user.badges', []] },
          signature: '$user.signature',
          username_shimmer: { $ifNull: ['$user.username_shimmer', 0] },
          username_shimmer_color1: { $ifNull: ['$user.username_shimmer_color1', '#4a9eff'] },
          username_shimmer_color2: { $ifNull: ['$user.username_shimmer_color2', '#f97316'] },
          username_verified: { $ifNull: ['$user.username_verified', 0] },
          user_joined: '$user.created_at'
        }
      },
      { $project: { user: 0 } },
      { $sort: { created_at: 1 } }
    ]).toArray();

    // Подсчёт постов пользователя
    for (const post of posts) {
      if (post.author_id) {
        post.user_post_count = await db.collection('posts').countDocuments({ author_id: post.author_id });
      } else {
        post.user_post_count = 0;
      }
    }

    // Проверка REP
    const _viewerKey = req.query.viewerKey || '';
    const viewerUserId = _viewerKey.startsWith('user:') ? _viewerKey.replace('user:', '') : null;
    if (viewerUserId && posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const repGiven = await db.collection('post_rep').find({
        user_id: new ObjectId(viewerUserId),
        post_id: { $in: postIds }
      }).toArray();
      const repSet = new Set(repGiven.map(r => r.post_id.toString()));
      posts = posts.map(p => ({ ...p, rep_given: repSet.has(p._id.toString()) }));
    } else {
      posts = posts.map(p => ({ ...p, rep_given: false }));
    }

    // Получить теги
    const threadTags = await db.collection('thread_tags').find({ thread_id: threadId }).toArray();
    const tagIds = threadTags.map(tt => tt.tag_id);
    const tagsData = tagIds.length > 0 
      ? await db.collection('tags').find({ _id: { $in: tagIds } }).sort({ name: 1 }).toArray()
      : [];
    const tags = tagsData.map(t => t.name);

    res.json({ ...thread, tags, posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/threads/:id/posts', async (req, res) => {
  try {
    const { content, userId } = req.body;
    const threadId = new ObjectId(req.params.id);
    
    const thread = await db.collection('threads').findOne({ _id: threadId });
    if (!thread) return res.status(404).json({ error: 'Тема не найдена' });
    if (thread.locked === 1) return res.status(403).json({ error: 'Тема закрыта для ответов' });
    if (userId && await isUserBanned(userId)) return res.status(403).json({ error: 'Аккаунт заблокирован' });

    const result = await db.collection('posts').insertOne({
      thread_id: threadId,
      author_id: new ObjectId(userId),
      content,
      likes: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    await db.collection('threads').updateOne({ _id: threadId }, { $set: { updated_at: new Date() } });
    res.json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/threads', async (req, res) => {
  try {
    const { title, content, category_id, author_id, tags } = req.body;
    if (author_id && await isUserBanned(author_id)) return res.status(403).json({ error: 'Аккаунт заблокирован' });

    const threadResult = await db.collection('threads').insertOne({
      title,
      category_id: new ObjectId(category_id),
      author_id: new ObjectId(author_id),
      views: 0,
      pinned: 0,
      locked: 0,
      hidden: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    const threadId = threadResult.insertedId;

    await db.collection('posts').insertOne({
      thread_id: threadId,
      author_id: new ObjectId(author_id),
      content,
      likes: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags.map(t => String(t).trim()).filter(Boolean).slice(0, 6)) {
        let tag = await db.collection('tags').findOne({ name: tagName });
        if (!tag) {
          const r = await db.collection('tags').insertOne({ name: tagName });
          tag = { _id: r.insertedId };
        }
        try {
          await db.collection('thread_tags').insertOne({ thread_id: threadId, tag_id: tag._id });
        } catch (e) {}
      }
    }

    res.json({ id: threadId });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Ошибка при создании темы' });
  }
});

// API для пользователей
app.get('/api/users', async (req, res) => {
  try {
    const { search } = req.query;
    let match = {};
    
    if (search) {
      match.username = { $regex: search, $options: 'i' };
    }

    const users = await db.collection('users').find(match).toArray();
    
    for (const user of users) {
      user.id = user._id;
      user.post_count = await db.collection('posts').countDocuments({ author_id: user._id });
      user.is_online = user.last_seen && user.last_seen > new Date(Date.now() - 5 * 60 * 1000) ? 1 : 0;
      delete user.password;
    }

    users.sort((a, b) => b.reputation - a.reputation);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const postCount = await db.collection('posts').countDocuments({ author_id: user._id });
    const threadCount = await db.collection('threads').countDocuments({ author_id: user._id });
    const pluginCount = await db.collection('plugins').countDocuments({ author_id: user._id });

    const recentPosts = await db.collection('posts')
      .find({ author_id: user._id })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    const recentActivity = [];
    for (const post of recentPosts) {
      const thread = await db.collection('threads').findOne({ _id: post.thread_id });
      recentActivity.push({
        type: 'post',
        title: post.content.substring(0, 100),
        created_at: post.created_at,
        thread_title: thread?.title || 'Unknown'
      });
    }

    delete user.password;
    res.json({ ...user, id: user._id, post_count: postCount, thread_count: threadCount, plugin_count: pluginCount, recentActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      threads: await db.collection('threads').countDocuments(),
      posts: await db.collection('posts').countDocuments(),
      users: await db.collection('users').countDocuments(),
      plugins: await db.collection('plugins').countDocuments(),
      online: await db.collection('users').countDocuments({
        last_seen: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
      })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Публичные настройки
app.get('/api/settings/public', async (req, res) => {
  try {
    const enableCaptcha = await getSetting('enableCaptcha', '1');
    const registrationEnabled = await getSetting('registrationEnabled', '1');
    res.json({ enableCaptcha: enableCaptcha === '1', registrationEnabled: registrationEnabled === '1' });
  } catch (e) {
    res.json({ enableCaptcha: true, registrationEnabled: true });
  }
});

// Капча
app.get('/api/captcha', (req, res) => {
  cleanCaptchaExpired();
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const id = crypto.randomBytes(8).toString('hex');
  captchaStore.set(id, { answer: a + b, expires: Date.now() + CAPTCHA_TTL_MS });
  res.json({ id, a, b });
});

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, captchaId, captchaAnswer } = req.body;
    const enableCaptcha = await getSetting('enableCaptcha');

    if (enableCaptcha === '1') {
      if (!captchaId || captchaAnswer === undefined || captchaAnswer === '') {
        return res.json({ error: 'Введите ответ капчи' });
      }
      cleanCaptchaExpired();
      const cap = captchaStore.get(captchaId);
      captchaStore.delete(captchaId);
      if (!cap || cap.expires < Date.now()) return res.json({ error: 'Капча истекла. Обновите и попробуйте снова' });
      if (Number(captchaAnswer) !== cap.answer) return res.json({ error: 'Неверный ответ капчи' });
    }

    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.json({ error: 'Неверное имя пользователя или пароль' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (user.password !== hashedPassword) {
      return res.json({ error: 'Неверное имя пользователя или пароль' });
    }

    if (user.banned === 1) {
      const ban = await db.collection('bans')
        .find({ user_id: user._id })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      let banInfo = { reason: 'Не указана', bannedBy: 'Администрация', createdAt: null };
      if (ban.length > 0) {
        const banner = await db.collection('users').findOne({ _id: ban[0].banned_by });
        banInfo = {
          reason: ban[0].reason || 'Не указана',
          bannedBy: banner?.username || 'Администрация',
          createdAt: ban[0].created_at
        };
      }

      return res.json({
        banned: true,
        error: 'Ваш аккаунт заблокирован',
        banInfo
      });
    }

    await db.collection('users').updateOne({ _id: user._id }, { $set: { last_seen: new Date() } });

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      badges: user.badges || [],
      avatar: user.avatar || null,
      username_shimmer: user.username_shimmer || 0,
      username_shimmer_color1: user.username_shimmer_color1 || '#4a9eff',
      username_shimmer_color2: user.username_shimmer_color2 || '#f97316',
      username_verified: user.username_verified || 0
    };

    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json({ valid: false });

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.json({ valid: false });

    if (user.banned === 1) {
      const ban = await db.collection('bans')
        .find({ user_id: user._id })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      let banInfo = { reason: 'Не указана', bannedBy: 'Администрация', createdAt: null };
      if (ban.length > 0) {
        const banner = await db.collection('users').findOne({ _id: ban[0].banned_by });
        banInfo = {
          reason: ban[0].reason || 'Не указана',
          bannedBy: banner?.username || 'Администрация',
          createdAt: ban[0].created_at
        };
      }

      return res.json({ banned: true, banInfo });
    }
    res.json({ valid: true });
  } catch (error) {
    res.json({ valid: false });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json({ valid: false });

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.json({ valid: false });
    if (user.banned === 1) return res.json({ banned: true });
    res.json({ valid: true });
  } catch (error) {
    res.json({ valid: false });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, captchaId, captchaAnswer } = req.body;
    const enableCaptcha = await getSetting('enableCaptcha');

    if (enableCaptcha === '1') {
      if (!captchaId || captchaAnswer === undefined || captchaAnswer === '') {
        return res.json({ error: 'Введите ответ капчи' });
      }
      cleanCaptchaExpired();
      const cap = captchaStore.get(captchaId);
      captchaStore.delete(captchaId);
      if (!cap || cap.expires < Date.now()) return res.json({ error: 'Капча истекла. Обновите и попробуйте снова' });
      if (Number(captchaAnswer) !== cap.answer) return res.json({ error: 'Неверный ответ капчи' });
    }

    const registrationEnabled = await getSetting('registrationEnabled');
    if (registrationEnabled !== '1') {
      return res.json({ error: 'Регистрация временно отключена' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const result = await db.collection('users').insertOne({
      username,
      email,
      password: hashedPassword,
      role: 'user',
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
    });

    const user = await db.collection('users').findOne({ _id: result.insertedId });
    delete user.password;
    res.json({ user: { ...user, id: user._id } });
  } catch (error) {
    if (error.code === 11000) {
      res.json({ error: 'Пользователь с таким именем или email уже существует' });
    } else {
      res.json({ error: 'Ошибка при регистрации' });
    }
  }
});

// Админ API
app.get('/api/admin/threads', async (req, res) => {
  try {
    const threads = await db.collection('threads').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          author_name: { $ifNull: ['$author.username', 'Unknown'] }
        }
      },
      { $project: { author: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    const result = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      badges: u.badges,
      banned: u.banned,
      created_at: u.created_at,
      username_shimmer: u.username_shimmer,
      username_shimmer_color1: u.username_shimmer_color1,
      username_shimmer_color2: u.username_shimmer_color2,
      username_verified: u.username_verified
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/plugins', async (req, res) => {
  try {
    const plugins = await db.collection('plugins').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          id: '$_id',
          author_name: { $ifNull: ['$author.username', 'Unknown'] }
        }
      },
      { $project: { author: 0 } }
    ]).toArray();
    res.json(plugins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/banners', async (req, res) => {
  try {
    const banners = await db.collection('banners').find().toArray();
    res.json(banners.map(b => ({ ...b, id: b._id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/deleteThread', async (req, res) => {
  try {
    const { itemId } = req.body;
    const threadId = new ObjectId(itemId);
    
    const posts = await db.collection('posts').find({ thread_id: threadId }).toArray();
    const postIds = posts.map(p => p._id);
    
    if (postIds.length > 0) {
      await db.collection('post_reactions').deleteMany({ post_id: { $in: postIds } });
      await db.collection('post_likes').deleteMany({ post_id: { $in: postIds } });
      await db.collection('post_rep').deleteMany({ post_id: { $in: postIds } });
    }
    
    await db.collection('thread_tags').deleteMany({ thread_id: threadId });
    await db.collection('posts').deleteMany({ thread_id: threadId });
    await db.collection('threads').deleteOne({ _id: threadId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/pinThread', async (req, res) => {
  try {
    const { itemId } = req.body;
    const thread = await db.collection('threads').findOne({ _id: new ObjectId(itemId) });
    await db.collection('threads').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { pinned: thread.pinned ? 0 : 1 } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/lockThread', async (req, res) => {
  try {
    const { itemId } = req.body;
    const thread = await db.collection('threads').findOne({ _id: new ObjectId(itemId) });
    await db.collection('threads').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { locked: thread.locked ? 0 : 1 } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/hideThread', async (req, res) => {
  try {
    const { itemId } = req.body;
    const thread = await db.collection('threads').findOne({ _id: new ObjectId(itemId) });
    await db.collection('threads').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { hidden: thread.hidden ? 0 : 1 } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/editThread', async (req, res) => {
  try {
    const { itemId, title, tags } = req.body;
    const threadId = new ObjectId(itemId);
    
    await db.collection('threads').updateOne({ _id: threadId }, { $set: { title } });
    
    if (tags) {
      await db.collection('thread_tags').deleteMany({ thread_id: threadId });
      for (const tagName of tags) {
        let tag = await db.collection('tags').findOne({ name: tagName });
        if (!tag) {
          const result = await db.collection('tags').insertOne({ name: tagName });
          tag = { _id: result.insertedId };
        }
        await db.collection('thread_tags').insertOne({ thread_id: threadId, tag_id: tag._id });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/editUser', async (req, res) => {
  try {
    const { itemId, badges, role, username_shimmer, username_shimmer_color1, username_shimmer_color2, username_verified } = req.body;
    await db.collection('users').updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          badges: badges || [],
          role,
          username_shimmer: username_shimmer ? 1 : 0,
          username_shimmer_color1: username_shimmer_color1 || '#4a9eff',
          username_shimmer_color2: username_shimmer_color2 || '#f97316',
          username_verified: username_verified ? 1 : 0
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/deletePlugin', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('plugins').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/addBanner', async (req, res) => {
  try {
    const { title, image_url, url, position, active } = req.body;
    await db.collection('banners').insertOne({
      title,
      image_url,
      url: url || '',
      position: position || 'top',
      active: active === 0 ? 0 : 1,
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/deleteBanner', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('banners').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/banUser', async (req, res) => {
  try {
    const { itemId, reason } = req.body;
    const user = await db.collection('users').findOne({ _id: new ObjectId(itemId) });
    await db.collection('users').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { banned: user.banned ? 0 : 1 } }
    );
    
    if (!user.banned) {
      await db.collection('bans').insertOne({
        user_id: new ObjectId(itemId),
        reason,
        banned_by: new ObjectId('000000000000000000000001'),
        created_at: new Date()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/addCategory', async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    await db.collection('categories').insertOne({
      name,
      slug,
      description,
      icon,
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании категории' });
  }
});

app.post('/api/admin/deleteCategory', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('categories').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении категории' });
  }
});

app.post('/api/admin/editBanner', async (req, res) => {
  try {
    const { itemId, title, image_url, url, position, active } = req.body;
    await db.collection('banners').updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          title,
          image_url,
          url,
          position,
          active: active ? 1 : 0
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при редактировании баннера' });
  }
});

app.post('/api/admin/editCategory', async (req, res) => {
  try {
    const { itemId, name, slug, description, icon } = req.body;
    await db.collection('categories').updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          name,
          slug,
          description,
          icon: icon || null
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при редактировании категории' });
  }
});

app.post('/api/admin/addPlugin', async (req, res) => {
  try {
    const { name, slug, description, full_description, author_id, version, price, file_url, image_url } = req.body;
    const s = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await db.collection('plugins').insertOne({
      name,
      slug: s,
      description: description || '',
      full_description: full_description || '',
      author_id: new ObjectId(author_id),
      version: version || '1.0',
      price: price || 0,
      file_url: file_url || '',
      image_url: image_url || '',
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ошибка при добавлении плагина' });
  }
});

app.post('/api/admin/editPlugin', async (req, res) => {
  try {
    const { itemId, name, slug, description, full_description, version, price, file_url, image_url } = req.body;
    await db.collection('plugins').updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          name,
          slug,
          description,
          full_description,
          version,
          price,
          file_url,
          image_url
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при редактировании плагина' });
  }
});

// Лайки постов
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }
    if (await isUserBanned(userId)) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    
    const postId = new ObjectId(req.params.id);
    const existingLike = await db.collection('post_likes').findOne({
      post_id: postId,
      user_id: new ObjectId(userId)
    });
    
    if (existingLike) {
      await db.collection('post_likes').deleteOne({ _id: existingLike._id });
      await db.collection('posts').updateOne({ _id: postId }, { $inc: { likes: -1 } });
    } else {
      await db.collection('post_likes').insertOne({
        post_id: postId,
        user_id: new ObjectId(userId),
        created_at: new Date()
      });
      await db.collection('posts').updateOne({ _id: postId }, { $inc: { likes: 1 } });
    }
    
    const post = await db.collection('posts').findOne({ _id: postId });
    res.json({ success: true, likes: post.likes || 0, liked: !existingLike });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обработке лайка' });
  }
});

// Реакции к постам
app.get('/api/posts/reactions', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    if (!ids.length) return res.json({});
    
    const reactions = await db.collection('post_reactions').aggregate([
      { $match: { post_id: { $in: ids } } },
      {
        $group: {
          _id: { post_id: '$post_id', reaction: '$reaction' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const result = {};
    reactions.forEach(r => {
      const postId = r._id.post_id.toString();
      if (!result[postId]) result[postId] = {};
      result[postId][r._id.reaction] = r.count;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({});
  }
});

app.post('/api/posts/:id/react', async (req, res) => {
  try {
    const { userId, reaction } = req.body;
    const postId = new ObjectId(req.params.id);
    
    if (!userId || !reaction) {
      return res.status(400).json({ error: 'userId и reaction обязательны' });
    }
    if (await isUserBanned(userId)) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    
    const existing = await db.collection('post_reactions').findOne({
      post_id: postId,
      user_id: new ObjectId(userId),
      reaction
    });
    
    if (existing) {
      await db.collection('post_reactions').deleteOne({ _id: existing._id });
    } else {
      await db.collection('post_reactions').insertOne({
        post_id: postId,
        user_id: new ObjectId(userId),
        reaction,
        created_at: new Date()
      });
    }
    
    const reactions = await db.collection('post_reactions').aggregate([
      { $match: { post_id: postId } },
      {
        $group: {
          _id: '$reaction',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const summary = {};
    reactions.forEach(r => { summary[r._id] = r.count; });
    res.json({ success: true, reactions: summary });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обработке реакции' });
  }
});

// +REP посту
app.post('/api/posts/:id/rep', async (req, res) => {
  try {
    const postId = new ObjectId(req.params.id);
    const { userId } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Нужна авторизация' });
    if (await isUserBanned(userId)) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    
    const post = await db.collection('posts').findOne({ _id: postId });
    if (!post) return res.status(404).json({ error: 'Пост не найден' });
    if (post.author_id.toString() === userId) return res.status(400).json({ error: 'Нельзя дать REP своему посту' });
    
    const existing = await db.collection('post_rep').findOne({
      post_id: postId,
      user_id: new ObjectId(userId)
    });
    if (existing) return res.status(400).json({ error: 'Вы уже дали REP этому посту' });
    
    await db.collection('post_rep').insertOne({
      post_id: postId,
      user_id: new ObjectId(userId),
      created_at: new Date()
    });
    
    await db.collection('users').updateOne(
      { _id: post.author_id },
      { $inc: { reputation: 1 } }
    );
    
    const user = await db.collection('users').findOne({ _id: post.author_id });
    res.json({ success: true, reputation: user.reputation || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при выдаче REP' });
  }
});

// Получить баннеры
app.get('/api/banners', async (req, res) => {
  try {
    const { position } = req.query;
    let query = { active: 1 };
    
    if (position) {
      query.position = position;
    }
    
    const banners = await db.collection('banners')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();
    
    res.json(banners.map(b => ({ ...b, id: b._id })));
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.json([]);
  }
});

// Публичные уведомления
app.get('/api/notices', async (req, res) => {
  try {
    const notices = await db.collection('notices').find({ active: 1 }).toArray();
    res.json(notices.map(n => ({ ...n, id: n._id })));
  } catch (error) {
    res.json([]);
  }
});

// Отправка отчета
app.post('/api/reports', async (req, res) => {
  try {
    const { type, content_id, reported_id, content_summary, userId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Необходима авторизация' });
    
    await db.collection('reports').insertOne({
      type: type || 'post',
      content_id,
      reporter_id: new ObjectId(userId),
      reported_id: reported_id ? new ObjectId(reported_id) : null,
      content_summary: content_summary || '',
      status: 'pending',
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при отправке отчета' });
  }
});

// Профиль - обновление
app.put('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { userId, bio, location, website, avatar, signature, banner_url } = req.body;
    
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user._id.toString() !== userId) return res.status(403).json({ error: 'Нет прав на редактирование' });
    
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          bio: bio || null,
          location: location || null,
          website: website || null,
          avatar: avatar || null,
          signature: signature || null,
          banner_url: banner_url || null
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});

// Настройки профиля
app.get('/api/users/:username/settings', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    const ps = await db.collection('profile_settings').findOne({ user_id: user._id });
    res.json(ps || { show_stats: 1, show_activity: 1, show_online: 1 });
  } catch (error) {
    res.json({ show_stats: 1, show_activity: 1, show_online: 1 });
  }
});

app.put('/api/users/:username/settings', async (req, res) => {
  try {
    const { username } = req.params;
    const { userId, show_stats, show_activity, show_online } = req.body;
    
    const user = await db.collection('users').findOne({ username });
    if (!user || user._id.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });
    
    await db.collection('profile_settings').updateOne(
      { user_id: user._id },
      {
        $set: {
          show_stats: show_stats !== false ? 1 : 0,
          show_activity: show_activity !== false ? 1 : 0,
          show_online: show_online !== false ? 1 : 0
        }
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Админ - уведомления
app.get('/api/admin/notices', async (req, res) => {
  try {
    const notices = await db.collection('notices').find().sort({ _id: -1 }).toArray();
    res.json(notices.map(n => ({ ...n, id: n._id })));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admin/addNotice', async (req, res) => {
  try {
    const { title, message, type, position, dismissible } = req.body;
    await db.collection('notices').insertOne({
      title,
      message,
      type: type || 'info',
      position: position || 'top',
      dismissible: dismissible !== false ? 1 : 0,
      active: 1,
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.post('/api/admin/editNotice', async (req, res) => {
  try {
    const { itemId, title, message, type, position, dismissible, active } = req.body;
    await db.collection('notices').updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          title,
          message,
          type,
          position,
          dismissible: dismissible !== false ? 1 : 0,
          active: active !== false ? 1 : 0
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.post('/api/admin/deleteNotice', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('notices').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.post('/api/admin/toggleNotice', async (req, res) => {
  try {
    const { itemId } = req.body;
    const notice = await db.collection('notices').findOne({ _id: new ObjectId(itemId) });
    await db.collection('notices').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { active: notice.active ? 0 : 1 } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Админ - настройки
app.get('/api/admin/settings', async (req, res) => {
  try {
    const rows = await db.collection('site_settings').find().toArray();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.json({});
  }
});

app.post('/api/admin/saveSettings', async (req, res) => {
  try {
    const keys = ['siteName', 'siteDescription', 'siteUrl', 'contactEmail', 'registrationEnabled', 'maintenanceMode', 'postsPerPage', 'threadsPerPage', 'allowGuestViewing', 'enableCaptcha'];
    const settings = {};
    keys.forEach(k => { if (req.body[k] !== undefined) settings[k] = req.body[k]; });
    
    for (const [k, v] of Object.entries(settings)) {
      await db.collection('site_settings').updateOne(
        { key: k },
        { $set: { value: String(v) } },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при сохранении настроек' });
  }
});

// Админ - отчеты
app.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await db.collection('reports').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'reporter_id',
          foreignField: '_id',
          as: 'reporter'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reported_id',
          foreignField: '_id',
          as: 'reported'
        }
      },
      {
        $addFields: {
          id: '$_id',
          reporter_name: { $arrayElemAt: ['$reporter.username', 0] },
          reported_name: { $arrayElemAt: ['$reported.username', 0] }
        }
      },
      { $project: { reporter: 0, reported: 0 } },
      { $sort: { created_at: -1 } }
    ]).toArray();
    res.json(reports);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admin/resolveReport', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('reports').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { status: 'resolved', resolved_at: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.post('/api/admin/rejectReport', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('reports').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { status: 'rejected' } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.post('/api/admin/deleteReport', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('reports').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Админ - предупреждения (заглушки для совместимости)
app.get('/api/admin/warnings', async (req, res) => {
  res.json([]);
});

// Админ - группы пользователей
app.get('/api/admin/groups', async (req, res) => {
  try {
    const groups = await db.collection('user_groups').find().toArray();
    res.json(groups.map(g => ({ ...g, id: g._id })));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admin/addGroup', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const result = await db.collection('user_groups').insertOne({
      name,
      permissions: permissions || [],
      created_at: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания группы' });
  }
});

app.post('/api/admin/editGroup', async (req, res) => {
  try {
    const { itemId, name, permissions } = req.body;
    await db.collection('user_groups').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { name, permissions } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления группы' });
  }
});

app.post('/api/admin/deleteGroup', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('user_groups').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления группы' });
  }
});

// Админ - модераторы
app.get('/api/admin/moderators', async (req, res) => {
  try {
    const moderators = await db.collection('users').find({ 
      role: { $in: ['moderator', 'admin'] } 
    }).toArray();
    res.json(moderators.map(m => ({
      id: m._id,
      username: m.username,
      role: m.role,
      email: m.email
    })));
  } catch (error) {
    res.json([]);
  }
});

// Админ - логи
app.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await db.collection('admin_logs')
      .find()
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
    res.json(logs.map(l => ({ ...l, id: l._id })));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admin/addLog', async (req, res) => {
  try {
    const { action, details, userId } = req.body;
    await db.collection('admin_logs').insertOne({
      action,
      details,
      user_id: new ObjectId(userId),
      created_at: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка записи лога' });
  }
});

// Админ - бэкапы
app.get('/api/admin/backups', async (req, res) => {
  try {
    const backups = await db.collection('backups')
      .find()
      .sort({ created_at: -1 })
      .toArray();
    res.json(backups.map(b => ({ ...b, id: b._id })));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admin/createBackup', async (req, res) => {
  try {
    const { name } = req.body;
    const collections = ['users', 'threads', 'posts', 'plugins', 'categories'];
    const backupData = {};
    
    for (const col of collections) {
      backupData[col] = await db.collection(col).find().toArray();
    }
    
    await db.collection('backups').insertOne({
      name: name || `backup_${Date.now()}`,
      data: backupData,
      size: JSON.stringify(backupData).length,
      created_at: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания бэкапа' });
  }
});

app.post('/api/admin/deleteBackup', async (req, res) => {
  try {
    const { itemId } = req.body;
    await db.collection('backups').deleteOne({ _id: new ObjectId(itemId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления бэкапа' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
