const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM profile LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const { name, email, phone, location, linkedin_url, indeed_url, website, summary } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE profile SET name=$1, email=$2, phone=$3, location=$4,
        linkedin_url=$5, indeed_url=$6, website=$7, summary=$8, updated_at=NOW()
       WHERE id=(SELECT id FROM profile LIMIT 1) RETURNING *`,
      [name, email, phone, location, linkedin_url, indeed_url, website, summary]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
