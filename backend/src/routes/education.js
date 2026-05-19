const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM education ORDER BY end_date DESC NULLS FIRST, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { institution, degree, field_of_study, start_date, end_date, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO education (institution, degree, field_of_study, start_date, end_date, is_public)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [institution, degree || null, field_of_study || null, start_date || null, end_date || null, is_public !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { institution, degree, field_of_study, start_date, end_date, is_public } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE education SET institution=$1, degree=$2, field_of_study=$3,
        start_date=$4, end_date=$5, is_public=$6 WHERE id=$7 RETURNING *`,
      [institution, degree || null, field_of_study || null, start_date || null, end_date || null, is_public !== false, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM education WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/visibility', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE education SET is_public = NOT is_public WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
