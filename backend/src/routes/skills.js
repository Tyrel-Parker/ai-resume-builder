const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM skills ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, category, proficiency, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO skills (name, category, proficiency, is_public, sort_order)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM skills))
       RETURNING *`,
      [name, category || null, proficiency || null, is_public !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, category, proficiency, is_public } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE skills SET name=$1, category=$2, proficiency=$3, is_public=$4 WHERE id=$5 RETURNING *',
      [name, category || null, proficiency || null, is_public !== false, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM skills WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/visibility', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE skills SET is_public = NOT is_public WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
