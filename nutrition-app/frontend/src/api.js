const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Error en ${path}`);
  }
  return data;
}

export const api = {
  getProfile: () => request('/profile'),
  saveProfile: (profile) => request('/profile', { method: 'PUT', body: JSON.stringify(profile) }),

  getWeightHistory: () => request('/weight'),
  addWeightEntry: (entry) => request('/weight', { method: 'POST', body: JSON.stringify(entry) }),
  updateWeightEntry: (id, entry) => request(`/weight/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteWeightEntry: (id) => request(`/weight/${id}`, { method: 'DELETE' }),

  getFoods: () => request('/foods'),
  estimateFood: (name) => request(`/foods/estimate?name=${encodeURIComponent(name)}`),
  addFood: (food) => request('/foods', { method: 'POST', body: JSON.stringify(food) }),
  updateFood: (id, food) => request(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(food) }),
  likeFood: (id) => request(`/foods/${id}/like`, { method: 'POST' }),
  dislikeFood: (id) => request(`/foods/${id}/dislike`, { method: 'POST' }),
  unlikeFood: (id) => request(`/foods/${id}/unlike`, { method: 'POST' }),
  deleteFood: (id) => request(`/foods/${id}`, { method: 'DELETE' }),

  getDailyMenu: () => request('/menu/daily'),
  getWeeklyMenu: () => request('/menu/weekly'),
  saveFavoriteMenu: (menu) => request('/menu/favorite', { method: 'POST', body: JSON.stringify(menu) }),
  getFavoriteMenus: () => request('/menu/favorites'),
  deleteFavoriteMenu: (id) => request(`/menu/favorites/${id}`, { method: 'DELETE' }),

  getDailyLog: (date) => request(`/log${date ? `?date=${date}` : ''}`),
  addLogEntry: (foodId, date) => request('/log', { method: 'POST', body: JSON.stringify({ foodId, date }) }),
  deleteLogEntry: (logId) => request(`/log/${logId}`, { method: 'DELETE' }),
};
