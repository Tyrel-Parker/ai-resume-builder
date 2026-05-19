require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://resume.tyrelparker.dev' }));
app.use(express.json({ limit: '10mb' }));

app.use('/profile', require('./routes/profile'));
app.use('/jobs', require('./routes/jobs'));
app.use('/skills', require('./routes/skills'));
app.use('/education', require('./routes/education'));
app.use('/generate', require('./routes/generate'));
app.use('/export', require('./routes/export'));
app.use('/import', require('./routes/import'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
