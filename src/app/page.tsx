"use client";

import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Github,
  Code2,
  Database,
  Globe,
  Smartphone,
} from "lucide-react";
import { createClient } from "../../supabase/client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ----------------- Types -----------------
interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  created_at?: string;
}

interface Skill {
  icon: React.ReactNode;
  name: string;
  technologies: string[];
}

// ----------------- Component -----------------
export default function Home() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = createClient();

  // ----------------- Refs for animations -----------------
  const projectsRef = useRef(null);
  const skillsRef = useRef(null);
  const contactRef = useRef(null);

  const projectsInView = useInView(projectsRef, {
    once: true,
    margin: "-100px",
  });
  const skillsInView = useInView(skillsRef, { once: true, margin: "-100px" });
  const contactInView = useInView(contactRef, { once: true, margin: "-100px" });

  // ----------------- Mock projects -----------------
  const mockProjects: Project[] = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description:
        "A full-stack e-commerce solution built with Next.js, featuring user authentication, payment processing, and admin dashboard.",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
      technologies: ["Next.js", "TypeScript", "Stripe", "Supabase"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
      featured: true,
    },
    {
      id: 2,
      title: "Task Management App",
      description:
        "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.",
      image:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&q=80",
      technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
      featured: true,
    },
    {
      id: 3,
      title: "Weather Dashboard",
      description:
        "A responsive weather dashboard with location-based forecasts, interactive maps, and detailed weather analytics.",
      image:
        "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&q=80",
      technologies: ["Vue.js", "Chart.js", "OpenWeather API", "Tailwind CSS"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
      featured: false,
    },
    {
      id: 4,
      title: "Portfolio Website",
      description:
        "A modern, responsive portfolio website built with Next.js and Framer Motion, featuring dark mode and smooth animations.",
      image:
        "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80",
      technologies: ["Next.js", "Framer Motion", "Tailwind CSS", "MDX"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
      featured: false,
    },
  ];

  // ----------------- Skills -----------------
  const skills: Skill[] = [
    {
      icon: <Code2 className="w-6 h-6" />,
      name: "Frontend Development",
      technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    },
    {
      icon: <Database className="w-6 h-6" />,
      name: "Backend Development",
      technologies: ["Node.js", "Python", "PostgreSQL", "Supabase"],
    },
    {
      icon: <Globe className="w-6 h-6" />,
      name: "Full-Stack Solutions",
      technologies: ["REST APIs", "GraphQL", "Authentication", "Deployment"],
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      name: "Mobile Development",
      technologies: ["React Native", "Flutter", "PWA", "Responsive Design"],
    },
  ];

  // ----------------- Animations -----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // ----------------- Fetch user & projects -----------------
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error || !data) {
          console.warn("No projects table found, using mock data:", error);
          setProjects(mockProjects);
        } else {
          setProjects(data);
        }
      } catch (err) {
        console.error("Unexpected error, using mock data:", err);
        setProjects(mockProjects);
      }
    };

    getUser();
    fetchProjects();

    // ----------------- Real-time subscription -----------------
    const projectsSubscription = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
    };
  }, [supabase.auth]);

  // ----------------- Render -----------------
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      {/* Projects Section */}
      <motion.section
        id="projects"
        className="py-24 bg-muted/30"
        ref={projectsRef}
        initial="hidden"
        animate={projectsInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          {/* Section Title */}
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <motion.h2 className="text-3xl font-bold mb-4 font-mono">
              &lt;Projects /&gt;
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto">
              A showcase of my recent work, featuring full-stack applications
              built with modern technologies.
            </motion.p>
          </motion.div>

          {/* Featured Projects */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-12"
            variants={containerVariants}
          >
            {projects
              .filter((p) => p.featured)
              .map((project) => (
                <motion.div key={project.id} variants={cardVariants}>
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {project.title}
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs font-mono">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </motion.div>

          {/* Non-featured Projects */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-2 gap-6"
            variants={containerVariants}
          >
            {projects
              .filter((p) => !p.featured)
              .map((project) => (
                <motion.div key={project.id} variants={cardVariants}>
                  <Card className="group hover:shadow-md transition-all duration-300 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        {project.title}
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs font-mono">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Skills Section */}
      <motion.section
        id="about"
        className="py-24 bg-background"
        ref={skillsRef}
        initial="hidden"
        animate={skillsInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <motion.h2 className="text-3xl font-bold mb-4 font-mono">
              &lt;Skills /&gt;
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto">
              Technologies and tools I use to bring ideas to life.
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" variants={containerVariants}>
            {skills.map((skill, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="text-center hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <div className="text-primary">{skill.icon}</div>
                    </div>
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {skill.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs font-mono">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        id="contact"
        className="py-24 bg-muted/30"
        ref={contactRef}
        initial="hidden"
        animate={contactInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h2 className="text-3xl font-bold mb-4 font-mono" variants={itemVariants}>
            &lt;Contact /&gt;
          </motion.h2>
          <motion.p className="text-muted-foreground mb-8 max-w-2xl mx-auto" variants={itemVariants}>
            Let's work together to bring your ideas to life. I'm always open to discussing new opportunities.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg">
                <a href="mailto:hello@example.com">Get In Touch</a>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="outline" size="lg">
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                  Download Resume
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
