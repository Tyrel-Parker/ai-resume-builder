CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin_url VARCHAR(255),
  indeed_url VARCHAR(255),
  website VARCHAR(255),
  summary TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO profile (name) VALUES ('') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bullets (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education (
  id SERIAL PRIMARY KEY,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  job_description TEXT NOT NULL,
  company_name VARCHAR(255),
  job_title VARCHAR(255),
  resume_content TEXT,
  cover_letter_content TEXT,
  study_guide_content TEXT,
  bullets_used INTEGER[],
  created_at TIMESTAMP DEFAULT NOW()
);
