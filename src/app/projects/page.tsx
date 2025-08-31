"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Github,
  Filter,
  Search,
  Calendar,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useState, useMemo, useEffect } from "react";
import { createClient } from "../../../supabase/client";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string | null;
  technologies: string[];
  category: string;
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  date: string;
  status: string;
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = createClient();

  const mockProjects = [
    {
      id: "1",
      title: "E-Commerce Platform",
      description:
        "A full-stack e-commerce solution built with Next.js, featuring user authentication, payment processing, and admin dashboard. Includes inventory management, order tracking, and analytics.",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
      technologies: [
        "Next.js",
        "TypeScript",
        "Stripe",
        "Supabase",
        "Tailwind CSS",
      ],
      category: "Full-Stack",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: true,
      date: "2024",
      status: "Completed",
    },
    {
      id: "2",
      title: "Task Management App",
      description:
        "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features. Built with modern React patterns.",
      image:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&q=80",
      technologies: ["React", "Node.js", "Socket.io", "MongoDB", "Express"],
      category: "Full-Stack",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: true,
      date: "2023",
      status: "Completed",
    },
    {
      id: "3",
      title: "Weather Dashboard",
      description:
        "A responsive weather dashboard with location-based forecasts, interactive maps, and detailed weather analytics. Features beautiful data visualizations.",
      image:
        "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&q=80",
      technologies: ["Vue.js", "Chart.js", "OpenWeather API", "Tailwind CSS"],
      category: "Frontend",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: false,
      date: "2023",
      status: "Completed",
    },
    {
      id: "4",
      title: "Portfolio Website",
      description:
        "A modern, responsive portfolio website built with Next.js and Framer Motion, featuring dark mode and smooth animations.",
      image:
        "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80",
      technologies: ["Next.js", "Framer Motion", "Tailwind CSS", "MDX"],
      category: "Frontend",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: false,
      date: "2024",
      status: "Completed",
    },
    {
      id: "5",
      title: "REST API Service",
      description:
        "A scalable REST API built with Node.js and Express, featuring JWT authentication, rate limiting, and comprehensive documentation.",
      image:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
      technologies: ["Node.js", "Express", "PostgreSQL", "JWT", "Swagger"],
      category: "Backend",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: false,
      date: "2023",
      status: "Completed",
    },
    {
      id: "6",
      title: "Mobile Chat App",
      description:
        "A real-time chat application built with React Native, featuring end-to-end encryption, file sharing, and push notifications.",
      image:
        "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600&q=80",
      technologies: ["React Native", "Firebase", "Socket.io", "Redux"],
      category: "Mobile",
      live_url: "https://example.com",
      github_url: "https://github.com",
      featured: false,
      date: "2024",
      status: "In Progress",
    },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.log("No projects table found, using mock data");
          setProjects(mockProjects);
        } else {
          setProjects(data || mockProjects);
        }
      } catch (err) {
        console.log("Using mock data:", err);
        setProjects(mockProjects);
      }
    };

    fetchProjects();

    // Set up real-time subscription for projects
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
        },
      )
      .subscribe();

    return () => {
      projectsSubscription.unsubscribe();
    };
  }, []);

  const categories = ["All", "Full-Stack", "Frontend", "Backend", "Mobile"];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.technologies.some((tech) =>
          tech.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 font-mono"
            variants={itemVariants}
          >
            &lt;Projects /&gt;
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            A collection of projects I've worked on, showcasing different
            technologies and approaches to solving real-world problems.
          </motion.p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-12"
          variants={itemVariants}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects, technologies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="font-mono"
              >
                <Filter className="mr-2 w-3 h-3" />
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Featured Projects */}
        <motion.div className="mb-16" variants={itemVariants}>
          <motion.h2
            className="text-3xl font-bold mb-8 font-mono"
            variants={itemVariants}
          >
            Featured Projects
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={containerVariants}
          >
            {filteredProjects
              .filter((p) => p.featured)
              .map((project) => (
                <motion.div
                  key={project.id}
                  variants={cardVariants}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {project.featured && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-yellow-500 text-yellow-900">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary">{project.status}</Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="w-4 h-4" />
                            {project.date}
                            <Badge variant="outline" className="ml-2">
                              {project.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        </motion.div>

        {/* All Projects */}
        <motion.div variants={itemVariants}>
          <motion.h2
            className="text-3xl font-bold mb-8 font-mono"
            variants={itemVariants}
          >
            All Projects ({filteredProjects.length})
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={cardVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                <Card className="group hover:shadow-md transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {project.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="w-3 h-3" />
                          {project.date}
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Github className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {project.description.length > 120
                        ? `${project.description.substring(0, 120)}...`
                        : project.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <Badge
                          key={tech}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {filteredProjects.length === 0 && (
          <motion.div className="text-center py-12" variants={itemVariants}>
            <p className="text-muted-foreground text-lg">
              No projects found matching your criteria.
            </p>
          </motion.div>
        )}
      </motion.div>

      <Footer />
    </div>
  );
}
