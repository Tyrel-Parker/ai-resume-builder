const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function generate(prompt, options = {}) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, ...options }),
    signal: AbortSignal.timeout(300_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.response;
}

async function selectBullets(jobDescription, bullets) {
  if (!bullets.length) return [];

  const bulletList = bullets
    .map(b => `ID:${b.id} [${b.company} — ${b.title}]: ${b.content}`)
    .join('\n');

  const prompt = `You are a resume expert. Given a job description and work experience bullets, select the 8-12 most relevant bullets.

JOB DESCRIPTION:
${jobDescription}

AVAILABLE BULLETS:
${bulletList}

Return ONLY a JSON array of the most relevant bullet IDs. Example: [3, 7, 12]`;

  const raw = await generate(prompt, { format: 'json' });

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number);
    // Ollama sometimes returns {"ids": [...]}
    const vals = Object.values(parsed)[0];
    if (Array.isArray(vals)) return vals.map(Number);
  } catch {
    const match = raw.match(/\[[\d,\s]+\]/);
    if (match) return JSON.parse(match[0]).map(Number);
  }

  return bullets.slice(0, 10).map(b => b.id);
}

async function generateResume(profile, selectedBullets, skills, education, jobDescription) {
  const byJob = {};
  for (const b of selectedBullets) {
    const key = `${b.title} at ${b.company}`;
    if (!byJob[key]) byJob[key] = [];
    byJob[key].push(b.content);
  }

  const expText = Object.entries(byJob)
    .map(([header, bullets]) => `${header}\n${bullets.map(b => `• ${b}`).join('\n')}`)
    .join('\n\n');

  const prompt = `Create a professional, ATS-optimized resume.

CANDIDATE:
Name: ${profile?.name || '[Name]'}
Email: ${profile?.email || ''}
Phone: ${profile?.phone || ''}
Location: ${profile?.location || ''}
${profile?.summary ? `\nSUMMARY:\n${profile.summary}` : ''}

RELEVANT EXPERIENCE:
${expText || '(none selected)'}

SKILLS: ${skills.map(s => s.name).join(', ') || '(none)'}

EDUCATION:
${education.map(e => `${e.degree || ''} ${e.field_of_study ? 'in ' + e.field_of_study : ''} — ${e.institution}${e.end_date ? ' (' + new Date(e.end_date).getFullYear() + ')' : ''}`).join('\n') || '(none)'}

TARGET JOB (for keyword optimization):
${jobDescription.substring(0, 1200)}

Write a complete, clean resume. Use strong action verbs. Quantify achievements. Return only the resume content.`;

  return generate(prompt);
}

async function generateCoverLetter(profile, selectedBullets, jobDescription, companyName, jobTitle) {
  const highlights = selectedBullets
    .slice(0, 5)
    .map(b => `• ${b.content}`)
    .join('\n');

  const prompt = `Write a professional cover letter.

APPLICANT: ${profile?.name || '[Name]'} | ${profile?.email || ''}
COMPANY: ${companyName || '[Company]'}
POSITION: ${jobTitle || '[Position]'}

JOB DESCRIPTION:
${jobDescription.substring(0, 1500)}

KEY ACHIEVEMENTS TO HIGHLIGHT:
${highlights}

Write 3-4 paragraphs. Be specific about the company and role. Connect the applicant's achievements directly to the job requirements. Professional but personable tone. Return only the cover letter content.`;

  return generate(prompt);
}

async function generateStudyGuide(selectedBullets, skills, jobDescription, jobTitle) {
  const prompt = `Create a personalized interview preparation guide.

POSITION: ${jobTitle || 'the role'}

JOB DESCRIPTION:
${jobDescription.substring(0, 1500)}

APPLICANT'S RELEVANT EXPERIENCE:
${selectedBullets.slice(0, 8).map(b => `• ${b.content}`).join('\n')}

APPLICANT'S SKILLS: ${skills.map(s => s.name).join(', ') || '(none listed)'}

Create a detailed, actionable prep guide with these sections:
1. SKILL GAPS — Topics in the job description the applicant should study
2. KEY CONCEPTS TO REVIEW — Specific technologies and concepts to brush up on
3. LIKELY INTERVIEW QUESTIONS — 8 questions with suggested answer approaches (use STAR method where applicable)
4. BEHAVIORAL QUESTIONS — 4 scenario questions relevant to this role
5. QUESTIONS TO ASK THE INTERVIEWER — 5 thoughtful questions
6. THINGS TO EMPHASIZE — Experience and accomplishments to prominently mention

Be specific and actionable. Return only the study guide content.`;

  return generate(prompt);
}

async function detectSections(text) {
  const prompt = `Split the following resume text into labeled sections. Return ONLY valid JSON with these exact keys. Copy text verbatim — do not summarize or modify. Use empty string if a section is not present.

{"profile": "contact/summary section text", "experience": "all work experience text", "education": "all education text", "skills": "all skills text"}

RESUME TEXT:
${text.substring(0, 12000)}`;

  const raw = await generate(prompt, { format: 'json' });
  const toStr = v => typeof v === 'string' ? v : (v ? JSON.stringify(v) : '');
  try {
    const parsed = JSON.parse(raw);
    return {
      profile: toStr(parsed.profile),
      experience: toStr(parsed.experience),
      education: toStr(parsed.education),
      skills: toStr(parsed.skills),
    };
  } catch {
    return { profile: '', experience: text, education: '', skills: '' };
  }
}

async function splitJobs(experienceText) {
  if (!experienceText.trim()) return [];

  const prompt = `The following text contains multiple work experience entries. Return a JSON array where each element is the raw text of one job entry including all its bullet points. Return ONLY the JSON array.

EXPERIENCE TEXT:
${experienceText.substring(0, 10000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
    if (Array.isArray(arr) && arr.length) return arr.filter(Boolean);
  } catch {}
  return [experienceText];
}

async function parseJobEntry(text) {
  const prompt = `Extract job details from this single work experience entry. Return ONLY valid JSON:

{"company": string, "title": string, "location": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "is_current": boolean, "bullets": [string]}

Rules:
- dates must be YYYY-MM-DD or null (use YYYY-01-01 when only year is known)
- is_current = true if no end date or end is "present"
- bullets = every achievement and responsibility as a separate string, none omitted

JOB ENTRY:
${text.substring(0, 3000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try {
    const parsed = JSON.parse(raw);
    if (parsed.company && parsed.title) return parsed;
  } catch {}
  return null;
}

async function parseProfileSection(text) {
  if (!text.trim()) return {};

  const prompt = `Extract contact and profile info from this text. Return ONLY valid JSON:

{"name": string|null, "email": string|null, "phone": string|null, "location": string|null, "summary": string|null}

TEXT:
${text.substring(0, 3000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try { return JSON.parse(raw); } catch { return {}; }
}

async function parseSkillsSection(text) {
  if (!text.trim()) return [];

  const prompt = `Extract all skills from this text as a flat JSON array of strings. Return ONLY the array.

TEXT:
${text.substring(0, 3000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
    if (Array.isArray(arr)) return arr.filter(Boolean);
  } catch {}
  return [];
}

async function parseEducationSection(text) {
  if (!text.trim()) return [];

  const prompt = `Extract all education entries from this text. Return ONLY a valid JSON array:

[{"institution": string, "degree": string|null, "field_of_study": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null}]

Rules: dates must be YYYY-MM-DD or null (use YYYY-01-01 when only year is known)

TEXT:
${text.substring(0, 3000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
    if (Array.isArray(arr)) return arr.filter(e => e.institution);
  } catch {}
  return [];
}

async function parseResumeTextSinglePass(text) {
  const prompt = `Extract ALL structured resume data from the following text. Return ONLY valid JSON — no markdown, no explanation:

{
  "profile": { "name": string|null, "email": string|null, "phone": string|null, "location": string|null, "summary": string|null },
  "jobs": [{ "company": string, "title": string, "location": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "is_current": boolean, "bullets": [string] }],
  "skills": [string],
  "education": [{ "institution": string, "degree": string|null, "field_of_study": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null }]
}

Rules:
- Include EVERY job, EVERY bullet point, EVERY skill, and EVERY education entry — do not skip or summarize
- dates must be YYYY-MM-DD or null (use YYYY-01-01 when only year is known)
- is_current = true if still at that job
- bullets = individual achievement/responsibility sentences, each as a separate string

RESUME TEXT:
${text.substring(0, 12000)}`;

  const raw = await generate(prompt, { format: 'json' });
  try {
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || {},
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
    };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON. Try again or check that the model is loaded.');
  }
}

async function parseResumeText(text) {
  if (process.env.AGENTIC_PARSE !== 'true') return parseResumeTextSinglePass(text);

  // Pass 1: split into sections
  const sections = await detectSections(text);

  // Pass 2: parse profile/skills/education in parallel, split experience into job chunks
  const [profile, jobTexts, skills, education] = await Promise.all([
    parseProfileSection(sections.profile || text),
    splitJobs(sections.experience),
    parseSkillsSection(sections.skills),
    parseEducationSection(sections.education),
  ]);

  // Pass 3: parse each job individually in parallel
  const jobs = (await Promise.all(jobTexts.map(parseJobEntry))).filter(Boolean);

  return { profile, jobs, skills, education };
}

module.exports = { selectBullets, generateResume, generateCoverLetter, generateStudyGuide, parseResumeText };
