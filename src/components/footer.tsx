import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Navigation Column */}
          <div>
            <h3 className="font-semibold mb-4 font-mono">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/projects"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/skills"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Skills
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Projects Column */}
          <div>
            <h3 className="font-semibold mb-4 font-mono">Featured Work</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  E-Commerce Platform
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Task Management
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Weather Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Portfolio Site
                </Link>
              </li>
            </ul>
          </div>

          {/* Technologies Column */}
          <div>
            <h3 className="font-semibold mb-4 font-mono">Technologies</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground">Next.js</span>
              </li>
              <li>
                <span className="text-muted-foreground">React</span>
              </li>
              <li>
                <span className="text-muted-foreground">TypeScript</span>
              </li>
              <li>
                <span className="text-muted-foreground">Supabase</span>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="font-semibold mb-4 font-mono">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@example.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Email
                </a>
              </li>
              <li>
                <a
                  href="/resume.pdf"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resume
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t">
          <div className="text-muted-foreground mb-4 md:mb-0 font-mono">
            © {currentYear} LoNg Portfolio. Built with Next.js & Supabase.
          </div>

          <div className="flex space-x-6">
            <a
              href="https://github.com"
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
            <a
              href="https://linkedin.com"
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com"
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
