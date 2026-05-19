const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT j.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id, 'content', b.content, 'is_public', b.is_public, 'sort_order', b.sort_order
            ) ORDER BY b.sort_order
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'
        ) as bullets
      FROM jobs j
      LEFT JOIN bullets b ON b.job_id = j.id
      GROUP BY j.id
      ORDER BY j.is_current DESC, j.end_date DESC NULLS FIRST, j.start_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { company, title, location, start_date, end_date, is_current, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO jobs (company, title, location, start_date, end_date, is_current, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [company, title, location, start_date || null, end_date || null, is_current || false, is_public !== false]
    );
    res.status(201).json({ ...rows[0], bullets: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { company, title, location, start_date, end_date, is_current, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE jobs SET company=$1, title=$2, location=$3, start_date=$4, end_date=$5,
        is_current=$6, is_public=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [company, title, location, start_date || null, end_date || null, is_current || false, is_public !== false, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM jobs WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/visibility', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE jobs SET is_public = NOT is_public WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bullet sub-routes
router.post('/:jobId/bullets', async (req, res) => {
  const { content, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO bullets (job_id, content, is_public, sort_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM bullets WHERE job_id=$1))
       RETURNING *`,
      [req.params.jobId, content, is_public !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:jobId/bullets/:id', async (req, res) => {
  const { content } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE bullets SET content=$1, updated_at=NOW() WHERE id=$2 AND job_id=$3 RETURNING *',
      [content, req.params.id, req.params.jobId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:jobId/bullets/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM bullets WHERE id=$1 AND job_id=$2', [req.params.id, req.params.jobId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:jobId/bullets/:id/visibility', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE bullets SET is_public = NOT is_public WHERE id=$1 AND job_id=$2 RETURNING *',
      [req.params.id, req.params.jobId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
