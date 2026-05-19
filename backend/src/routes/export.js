const express = require('express');
const router = express.Router();
const db = require('../db/connection');

async function getPublicData() {
  const [profileResult, jobsResult, skillsResult, eduResult] = await Promise.all([
    db.query('SELECT * FROM profile LIMIT 1'),
    db.query(`
      SELECT j.*, COALESCE(
        json_agg(
          json_build_object('id', b.id, 'content', b.content)
          ORDER BY b.sort_order
        ) FILTER (WHERE b.id IS NOT NULL AND b.is_public = true), '[]'
      ) as bullets
      FROM jobs j
      LEFT JOIN bullets b ON b.job_id = j.id
      WHERE j.is_public = true
      GROUP BY j.id
      ORDER BY j.is_current DESC, j.end_date DESC NULLS FIRST
    `),
    db.query('SELECT * FROM skills WHERE is_public = true ORDER BY sort_order'),
    db.query('SELECT * FROM education WHERE is_public = true ORDER BY end_date DESC NULLS FIRST'),
  ]);
  return {
    profile: profileResult.rows[0] || {},
    jobs: jobsResult.rows,
    skills: skillsResult.rows,
    education: eduResult.rows,
  };
}

function formatDate(d) {
  if (!d) return 'Present';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

router.get('/linkedin', async (req, res) => {
  try {
    const { profile, jobs, skills, education } = await getPublicData();
    const sections = [];

    if (profile.summary) {
      sections.push(`ABOUT\n${profile.summary}`);
    }

    if (jobs.length) {
      const exp = jobs.map(j => {
        const dates = `${formatDate(j.start_date)} – ${j.is_current ? 'Present' : formatDate(j.end_date)}`;
        const bullets = (j.bullets || []).map(b => `  • ${b.content}`).join('\n');
        return `${j.title}\n${j.company}${j.location ? ' · ' + j.location : ''}\n${dates}${bullets ? '\n' + bullets : ''}`;
      }).join('\n\n');
      sections.push(`EXPERIENCE\n${exp}`);
    }

    if (education.length) {
      const edu = education.map(e => {
        const degree = [e.degree, e.field_of_study].filter(Boolean).join(', ');
        const dates = `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`;
        return `${e.institution}\n${degree}\n${dates}`;
      }).join('\n\n');
      sections.push(`EDUCATION\n${edu}`);
    }

    if (skills.length) {
      sections.push(`SKILLS\n${skills.map(s => s.name).join(', ')}`);
    }

    res.json({ platform: 'linkedin', text: sections.join('\n\n---\n\n'), profile, jobs, skills, education });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/indeed', async (req, res) => {
  try {
    const { profile, jobs, skills, education } = await getPublicData();
    const lines = [];

    if (profile.name) lines.push(profile.name);
    if (profile.location) lines.push(profile.location);
    if (profile.email) lines.push(profile.email);
    if (profile.phone) lines.push(profile.phone);
    lines.push('');

    if (profile.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push(profile.summary);
      lines.push('');
    }

    if (jobs.length) {
      lines.push('WORK EXPERIENCE');
      for (const j of jobs) {
        lines.push(`${j.title} | ${j.company}${j.location ? ' | ' + j.location : ''}`);
        lines.push(`${formatDate(j.start_date)} – ${j.is_current ? 'Present' : formatDate(j.end_date)}`);
        for (const b of j.bullets || []) lines.push(`• ${b.content}`);
        lines.push('');
      }
    }

    if (education.length) {
      lines.push('EDUCATION');
      for (const e of education) {
        const degree = [e.degree, e.field_of_study].filter(Boolean).join(' in ');
        lines.push(`${degree ? degree + ' — ' : ''}${e.institution}`);
        if (e.end_date) lines.push(new Date(e.end_date).getFullYear().toString());
        lines.push('');
      }
    }

    if (skills.length) {
      lines.push('SKILLS');
      lines.push(skills.map(s => s.name).join(' • '));
    }

    res.json({ platform: 'indeed', text: lines.join('\n'), profile, jobs, skills, education });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
