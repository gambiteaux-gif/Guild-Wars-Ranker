const jsonHeaders = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  health: () => request('/health'),
  players: () => request('/players'),
  createPlayer: (body) => request('/players', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(body) }),
  updatePlayer: (id, body) => request(`/players/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(body) }),
  deletePlayer: (id) => request(`/players/${id}`, { method: 'DELETE' }),
  playerHistory: (id) => request(`/players/${id}/history`),
  wars: () => request('/wars'),
  war: (id) => request(`/wars/${id}`),
  createWar: (body) => request('/wars', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(body) }),
  deleteWar: (id) => request(`/wars/${id}`, { method: 'DELETE' }),
  updateWarStats: (id, stats) => request(`/wars/${id}/stats`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ stats }) }),
  leaderboard: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== 'All'));
    return request(`/leaderboard${query.size ? `?${query}` : ''}`);
  }
};
