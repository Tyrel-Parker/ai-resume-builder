const BASE = import.meta.env.VITE_API_URL;

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Profile
  getProfile: () => request('GET', '/profile'),
  updateProfile: (data) => request('PUT', '/profile', data),

  // Jobs
  getJobs: () => request('GET', '/jobs'),
  createJob: (data) => request('POST', '/jobs', data),
  updateJob: (id, data) => request('PUT', `/jobs/${id}`, data),
  deleteJob: (id) => request('DELETE', `/jobs/${id}`),
  toggleJobVisibility: (id) => request('PATCH', `/jobs/${id}/visibility`),

  // Bullets
  createBullet: (jobId, data) => request('POST', `/jobs/${jobId}/bullets`, data),
  updateBullet: (jobId, id, data) => request('PUT', `/jobs/${jobId}/bullets/${id}`, data),
  deleteBullet: (jobId, id) => request('DELETE', `/jobs/${jobId}/bullets/${id}`),
  toggleBulletVisibility: (jobId, id) => request('PATCH', `/jobs/${jobId}/bullets/${id}/visibility`),

  // Skills
  getSkills: () => request('GET', '/skills'),
  createSkill: (data) => request('POST', '/skills', data),
  updateSkill: (id, data) => request('PUT', `/skills/${id}`, data),
  deleteSkill: (id) => request('DELETE', `/skills/${id}`),
  toggleSkillVisibility: (id) => request('PATCH', `/skills/${id}/visibility`),

  // Education
  getEducation: () => request('GET', '/education'),
  createEducation: (data) => request('POST', '/education', data),
  updateEducation: (id, data) => request('PUT', `/education/${id}`, data),
  deleteEducation: (id) => request('DELETE', `/education/${id}`),
  toggleEducationVisibility: (id) => request('PATCH', `/education/${id}/visibility`),

  // Generate
  generate: (data) => request('POST', '/generate', data),
  getHistory: () => request('GET', '/generate/history'),
  getGenerated: (id) => request('GET', `/generate/${id}`),

  // Export
  exportLinkedIn: () => request('GET', '/export/linkedin'),
  exportIndeed: () => request('GET', '/export/indeed'),

  // Import
  importLinkedIn: (file) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/import/linkedin`, { method: 'POST', body: form })
      .then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText); } return r.json(); });
  },
  parseResumeText: (text) => request('POST', '/import/parse-text', { text }),
  saveImport: (data) => request('POST', '/import/save', data),
};
