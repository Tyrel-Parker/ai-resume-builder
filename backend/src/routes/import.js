const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const db = require('../db/connection');
const ollama = require('../services/ollama');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      current.push(field.trim());
      field = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      current.push(field.trim());
      if (current.some(f => f)) rows.push(current);
      current = []; field = '';
    } else {
      field += c;
    }
  }
  if (field || current.length) { current.push(field.trim()); if (current.some(f => f)) rows.push(current); }
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/['"]/g, '').trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] || '').replace(/^"|"$/g, '').trim(); });
    return obj;
  });
}

function parseLinkedInDate(str) {
  if (!str || str.toLowerCase() === 'present' || str === '') return null;
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const m = str.match(/^(\w{3})\s+(\d{4})$/i);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    return mo ? `${m[2]}-${String(mo).padStart(2, '0')}-01` : null;
  }
  const y = str.match(/^(\d{4})$/);
  if (y) return `${y[1]}-01-01`;
  return null;
}

function parseBullets(desc) {
  if (!desc) return [];
  return desc
    .split(/\n|•|▪|·/)
    .map(l => l.replace(/^[-*>]\s*/, '').trim())
    .filter(l => l.length > 10);
}

function col(row, ...names) {
  for (const n of names) {
    const key = Object.keys(row).find(k => k.includes(n));
    if (key && row[key]) return row[key];
  }
  return '';
}

// ── LinkedIn ZIP parse ────────────────────────────────────────────────────────

router.post('/linkedin', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    const getText = (...names) => {
      for (const e of entries) {
        const name = e.entryName.toLowerCase().replace(/.*\//, '');
        if (names.some(n => name === n.toLowerCase())) return e.getData().toString('utf8');
      }
      return null;
    };

    const positionsCsv = getText('Positions.csv', 'Work History.csv', 'positions.csv');
    const skillsCsv = getText('Skills.csv', 'skills.csv');
    const educationCsv = getText('Education.csv', 'education.csv');
    const profileCsv = getText('Profile.csv', 'profile.csv');

    const jobs = (positionsCsv ? parseCSV(positionsCsv) : []).map(row => ({
      company: col(row, 'company'),
      title: col(row, 'title'),
      location: col(row, 'location'),
      start_date: parseLinkedInDate(col(row, 'started', 'start')),
      end_date: parseLinkedInDate(col(row, 'finished', 'end')),
      is_current: !col(row, 'finished', 'end') || col(row, 'finished', 'end').toLowerCase() === 'present',
      bullets: parseBullets(col(row, 'description')),
    })).filter(j => j.company && j.title);

    const skills = (skillsCsv ? parseCSV(skillsCsv) : [])
      .map(row => col(row, 'name') || Object.values(row)[0])
      .filter(Boolean);

    const education = (educationCsv ? parseCSV(educationCsv) : []).map(row => {
      const degreeRaw = col(row, 'degree', 'notes');
      const [degree, field_of_study] = degreeRaw.includes(' in ')
        ? degreeRaw.split(' in ').map(s => s.trim())
        : [degreeRaw, ''];
      return {
        institution: col(row, 'school'),
        degree,
        field_of_study,
        start_date: parseLinkedInDate(col(row, 'start')),
        end_date: parseLinkedInDate(col(row, 'end')),
      };
    }).filter(e => e.institution);

    let profile = {};
    if (profileCsv) {
      const rows = parseCSV(profileCsv);
      if (rows[0]) {
        profile = {
          name: [col(rows[0], 'first'), col(rows[0], 'last')].filter(Boolean).join(' '),
          summary: col(rows[0], 'summary'),
          location: col(rows[0], 'address', 'geo'),
        };
      }
    }

    res.json({ source: 'linkedin', profile, jobs, skills, education });
  } catch (err) {
    console.error('LinkedIn parse error:', err);
    res.status(400).json({ error: 'Could not parse LinkedIn zip: ' + err.message });
  }
});

// ── Text / Indeed parse via Ollama ─────────────────────────────────────────────

router.post('/parse-text', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  req.socket.setTimeout(600_000);

  try {
    const parsed = await ollama.parseResumeText(text);
    res.json({ source: 'text', ...parsed });
  } catch (err) {
    console.error('Text parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Save / merge ───────────────────────────────────────────────────────────────

router.post('/save', async (req, res) => {
  const { profile, jobs, skills, education } = req.body;
  const results = { created: { jobs: 0, bullets: 0, skills: 0, education: 0 }, skipped: { jobs: 0, skills: 0, education: 0 } };

  if (profile && Object.values(profile).some(Boolean)) {
    const { rows } = await db.query('SELECT * FROM profile LIMIT 1');
    const current = rows[0] || {};
    const fields = ['name', 'email', 'phone', 'location', 'summary', 'linkedin_url', 'website'];
    const updates = fields.filter(f => profile[f] && !current[f]);
    if (updates.length) {
      const set = updates.map((f, i) => `${f}=$${i + 1}`).join(', ');
      await db.query(`UPDATE profile SET ${set} WHERE id=(SELECT id FROM profile LIMIT 1)`, updates.map(f => profile[f]));
    }
  }

  for (const job of jobs || []) {
    if (!job.company?.trim() || !job.title?.trim()) continue;
    const { rows: existing } = await db.query(
      'SELECT id FROM jobs WHERE LOWER(company)=LOWER($1) AND LOWER(title)=LOWER($2)',
      [job.company, job.title]
    );

    let jobId;
    if (existing.length) {
      jobId = existing[0].id;
      results.skipped.jobs++;
    } else {
      const { rows } = await db.query(
        `INSERT INTO jobs (company, title, location, start_date, end_date, is_current, is_public)
         VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
        [job.company, job.title, job.location || null, job.start_date || null, job.end_date || null, job.is_current || false]
      );
      jobId = rows[0].id;
      results.created.jobs++;
    }

    for (const content of job.bullets || []) {
      if (!content?.trim()) continue;
      const { rows: dup } = await db.query('SELECT id FROM bullets WHERE job_id=$1 AND content=$2', [jobId, content.trim()]);
      if (!dup.length) {
        await db.query(
          `INSERT INTO bullets (job_id, content, is_public, sort_order)
           VALUES ($1,$2,true,(SELECT COALESCE(MAX(sort_order),0)+1 FROM bullets WHERE job_id=$1))`,
          [jobId, content.trim()]
        );
        results.created.bullets++;
      }
    }
  }

  for (const name of skills || []) {
    if (!name?.trim()) continue;
    const { rows } = await db.query('SELECT id FROM skills WHERE LOWER(name)=LOWER($1)', [name.trim()]);
    if (!rows.length) {
      await db.query(
        `INSERT INTO skills (name, is_public, sort_order) VALUES ($1,true,(SELECT COALESCE(MAX(sort_order),0)+1 FROM skills))`,
        [name.trim()]
      );
      results.created.skills++;
    } else {
      results.skipped.skills++;
    }
  }

  for (const edu of education || []) {
    if (!edu.institution?.trim()) continue;
    const { rows } = await db.query('SELECT id FROM education WHERE LOWER(institution)=LOWER($1)', [edu.institution.trim()]);
    if (!rows.length) {
      await db.query(
        `INSERT INTO education (institution, degree, field_of_study, start_date, end_date, is_public)
         VALUES ($1,$2,$3,$4,$5,true)`,
        [edu.institution, edu.degree || null, edu.field_of_study || null, edu.start_date || null, edu.end_date || null]
      );
      results.created.education++;
    } else {
      results.skipped.education++;
    }
  }

  res.json(results);
});

module.exports = router;
