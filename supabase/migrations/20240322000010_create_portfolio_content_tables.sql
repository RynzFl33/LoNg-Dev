CREATE TABLE IF NOT EXISTS skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  level integer NOT NULL CHECK (level >= 0 AND level <= 100),
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  image text,
  technologies text[] NOT NULL DEFAULT '{}',
  category text NOT NULL,
  live_url text,
  github_url text,
  featured boolean DEFAULT false,
  date text NOT NULL,
  status text NOT NULL DEFAULT 'Completed',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS about_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL UNIQUE,
  title text,
  content text NOT NULL,
  data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_info (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL UNIQUE,
  title text NOT NULL,
  value text NOT NULL,
  link text,
  icon text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO skills (name, level, category) VALUES
  ('React', 95, 'Frontend'),
  ('TypeScript', 90, 'Language'),
  ('Next.js', 88, 'Framework'),
  ('Node.js', 85, 'Backend'),
  ('Tailwind CSS', 92, 'Styling'),
  ('PostgreSQL', 80, 'Database'),
  ('Supabase', 85, 'Backend'),
  ('Framer Motion', 78, 'Animation'),
  ('Git', 88, 'Tools'),
  ('Docker', 75, 'DevOps'),
  ('AWS', 70, 'Cloud'),
  ('Python', 82, 'Language')
ON CONFLICT DO NOTHING;

INSERT INTO contact_info (type, title, value, link, icon) VALUES
  ('email', 'Email', 'hello@example.com', 'mailto:hello@example.com', 'Mail'),
  ('phone', 'Phone', '+1 (555) 123-4567', 'tel:+15551234567', 'Phone'),
  ('location', 'Location', 'San Francisco, CA', '#', 'MapPin'),
  ('response_time', 'Response Time', 'Within 24 hours', '#', 'Clock')
ON CONFLICT DO NOTHING;

INSERT INTO about_content (section, title, content, data) VALUES
  ('hero', 'About Me', 'I''m a passionate full-stack developer with over 4 years of experience creating digital solutions that make a difference. I love turning complex problems into simple, beautiful, and intuitive designs.', NULL),
  ('experience', 'Experience', 'Professional work experience', '[
    {
      "title": "Senior Full-Stack Developer",
      "company": "Tech Solutions Inc.",
      "period": "2022 - Present",
      "description": "Leading development of scalable web applications using React, Next.js, and Node.js. Mentoring junior developers and architecting cloud solutions.",
      "technologies": ["React", "Next.js", "TypeScript", "AWS", "PostgreSQL"]
    },
    {
      "title": "Frontend Developer",
      "company": "Digital Agency Co.",
      "period": "2020 - 2022",
      "description": "Developed responsive web applications and collaborated with design teams to create pixel-perfect user interfaces.",
      "technologies": ["React", "Vue.js", "Sass", "JavaScript", "Figma"]
    },
    {
      "title": "Junior Developer",
      "company": "StartUp Ventures",
      "period": "2019 - 2020",
      "description": "Built and maintained web applications while learning modern development practices and agile methodologies.",
      "technologies": ["HTML", "CSS", "JavaScript", "PHP", "MySQL"]
    }
  ]'::jsonb),
  ('interests', 'Interests', 'Personal and professional interests', '["Open Source Contributions", "Machine Learning", "Mobile Development", "Cloud Architecture", "UI/UX Design", "Photography"]'::jsonb)
ON CONFLICT DO NOTHING;

alter publication supabase_realtime add table skills;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table about_content;
alter publication supabase_realtime add table contact_info;
