CREATE TABLE IF NOT EXISTS home_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO home_content (section, title, content, data) VALUES
('hero_greeting', 'Console Message', 'console.log("Hello, World!")', '{"icon": "terminal"}'),
('hero_name', 'Developer Name', 'LoNg', '{"gradient": true}'),
('hero_title', 'Main Title', 'Full-Stack Developer', '{}'),
('hero_subtitle', 'Subtitle', 'Building digital experiences with modern technologies', '{}'),
('hero_cta_primary', 'Primary CTA', 'View My Work', '{"href": "#projects", "icon": "code2"}'),
('hero_cta_secondary', 'Secondary CTA', 'Get In Touch', '{"href": "/contact", "icon": "mail"}'),
('hero_social_github', 'GitHub Link', 'https://github.com', '{"icon": "github"}'),
('hero_social_linkedin', 'LinkedIn Link', 'https://linkedin.com', '{"icon": "linkedin"}'),
('hero_social_email', 'Email Link', 'mailto:hello@example.com', '{"icon": "mail"}');

alter publication supabase_realtime add table home_content;