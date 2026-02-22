import { API_URL } from '../config';

export const api = {
  // Плагины
  getPlugins: async (search = '') => {
    const url = search ? `API_URL/plugins?search=${encodeURIComponent(search)}` : `API_URL/plugins`;
    const res = await fetch(url);
    return res.json();
  },
  
  getPlugin: async (slug) => {
    const res = await fetch(`API_URL/plugins/${slug}`);
    return res.json();
  },
  
  // Форум
  getCategories: async () => {
    const res = await fetch(`API_URL/categories`);
    return res.json();
  },
  
  getThreads: async (category = '') => {
    const url = category ? `API_URL/threads?category=${category}` : `API_URL/threads`;
    const res = await fetch(url);
    return res.json();
  },
  
  getThread: async (id, viewerKey = '') => {
    const qs = viewerKey ? `?viewerKey=${encodeURIComponent(viewerKey)}` : '';
    const res = await fetch(`API_URL/threads/${id}${qs}`);
    return res.json();
  },
  
  createPost: async (threadId, content, userId) => {
    const res = await fetch(`API_URL/threads/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId })
    });
    return res.json();
  },
  
  // Пользователи
  getUsers: async (search = '') => {
    const url = search ? `API_URL/users?search=${encodeURIComponent(search)}` : `API_URL/users`;
    const res = await fetch(url);
    return res.json();
  },
  
  getUser: async (username) => {
    const res = await fetch(`API_URL/users/${username}`);
    return res.json();
  },
  
  // Статистика
  getStats: async () => {
    const res = await fetch(`API_URL/stats`);
    return res.json();
  }
};
