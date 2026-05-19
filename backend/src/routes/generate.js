const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const ollama = require('../services/ollama');

router.post('/', async (req, res) => {
  const { jobDescription, companyName, jobTitle } = req.body;
  if (!jobDescription?.trim()) {
    return res.status(400).json({ error: 'jobDescription is required' });
  }

  req.socket.setTimeout(360_000);

  try {
    const [profileResult, jobsResult, skillsResult, eduResult] = await Promise.all([
      db.query('SELECT * FROM profile LIMIT 1'),
      db.query(`
        SELECT j.*, COALESCE(
          json_agg(
            json_build_object('id', b.id, 'content', b.content, 'is_public', b.is_public)
            ORDER BY b.sort_order
          ) FILTER (WHERE b.id IS NOT NULL), '[]'
        ) as bullets
        FROM jobs j
        LEFT JOIN bullets b ON b.job_id = j.id
        GROUP BY j.id
        ORDER BY j.is_current DESC, j.end_date DESC NULLS FIRST
      `),
      db.query('SELECT * FROM skills ORDER BY sort_order'),
      db.query('SELECT * FROM education ORDER BY end_date DESC NULLS FIRST'),
    ]);

    const profile = profileResult.rows[0];
    const skills = skillsResult.rows;
    const education = eduResult.rows;

    const allBullets = jobsResult.rows.flatMap(j =>
      (j.bullets || []).map(b => ({ ...b, company: j.company, title: j.title }))
    );

    const selectedIds = await ollama.selectBullets(jobDescription, allBullets);
    const selectedBullets = allBullets.filter(b => selectedIds.includes(b.id));

    const [resume, coverLetter, studyGuide] = await Promise.all([
      ollama.generateResume(profile, selectedBullets, skills, education, jobDescription),
      ollama.generateCoverLetter(profile, selectedBullets, jobDescription, companyName, jobTitle),
      ollama.generateStudyGuide(selectedBullets, skills, jobDescription, jobTitle),
    ]);

    const { rows } = await db.query(
      `INSERT INTO generated_documents
         (job_description, company_name, job_title, resume_content, cover_letter_content, study_guide_content, bullets_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [jobDescription, companyName || null, jobTitle || null, resume, coverLetter, studyGuide, selectedIds]
    );

    res.json({ id: rows[0].id, createdAt: rows[0].created_at, resume, coverLetter, studyGuide, bulletsUsed: selectedIds });
  } catch (err) {
    console.error('Generation error:', err);
    const isOllama = err.message?.includes('Ollama') || err.message?.includes('fetch');
    res.status(500).json({
      error: isOllama
        ? 'Could not reach Ollama. Make sure it is running and a model is pulled (run: make pull-model).'
        : err.message,
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, company_name, job_title, created_at FROM generated_documents ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM generated_documents WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
