"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Database,
  Globe,
  Smartphone,
  Download,
  MapPin,
  Calendar,
  Coffee,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database as DbTypes } from "@/types/supabase"; // adjust path as needed

interface AboutContent {
  id: string;
  section: string;
  title: string | null;
  content: string;
  data: any;
}

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  technologies: string[];
}

export default function AboutPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [aboutContent, setAboutContent] = useState<AboutContent[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Animation variants
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

  // Mock data as fallback
  const mockExperiences = [
    {
      title: "Senior Full-Stack Developer",
      company: "Tech Solutions Inc.",
      period: "2022 - Present",
      description:
        "Leading development of scalable web applications using React, Next.js, and Node.js. Mentoring junior developers and architecting cloud solutions.",
      technologies: ["React", "Next.js", "TypeScript", "AWS", "PostgreSQL"],
    },
    {
      title: "Frontend Developer",
      company: "Digital Agency Co.",
      period: "2020 - 2022",
      description:
        "Developed responsive web applications and collaborated with design teams to create pixel-perfect user interfaces.",
      technologies: ["React", "Vue.js", "Sass", "JavaScript", "Figma"],
    },
    {
      title: "Junior Developer",
      company: "StartUp Ventures",
      period: "2019 - 2020",
      description:
        "Built and maintained web applications while learning modern development practices and agile methodologies.",
      technologies: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
    },
  ];

  const mockInterests = [
    "Open Source Contributions",
    "Machine Learning",
    "Mobile Development",
    "Cloud Architecture",
    "UI/UX Design",
    "Photography",
  ];

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const { data, error } = await supabase
          .from("about_content")
          .select("*")
          .order("section", { ascending: true });

        if (error) {
          console.log("No about_content table found, using mock data");
          setExperiences(mockExperiences);
          setInterests(mockInterests);
        } else {
          setAboutContent(data || []);

          // Extract experiences and interests from the data
          const experienceContent = data?.find(
            (item) => item.section === "experience",
          );
          const interestsContent = data?.find(
            (item) => item.section === "interests",
          );

          setExperiences(experienceContent?.data || mockExperiences);
          setInterests(interestsContent?.data || mockInterests);
        }
      } catch (err) {
        console.log("Using mock data:", err);
        setExperiences(mockExperiences);
        setInterests(mockInterests);
      }
    };

    fetchAboutContent();

    // Set up real-time subscription for about content
    const aboutSubscription = supabase
      .channel("about-content-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "about_content",
        },
        () => {
          fetchAboutContent();
        },
      )
      .subscribe();

    return () => {
      aboutSubscription.unsubscribe();
    };
  }, []);

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
            &lt;About Me /&gt;
          </motion.h1>

          {/* Profile Picture */}
          <motion.div
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <motion.div
              className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/profile.jpg" // <-- Update this path to your image
                alt="Profile Picture"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </motion.div>
          </motion.div>

          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            I'm a passionate full-stack developer with over 4 years of
            experience creating digital solutions that make a difference. I love
            turning complex problems into simple, beautiful, and intuitive
            designs.
          </motion.p>
        </motion.div>

        {/* Personal Info Cards */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
        >
          {[
            { icon: MapPin, label: "Location", value: "San Francisco, CA" },
            { icon: Calendar, label: "Experience", value: "4+ Years" },
            { icon: Coffee, label: "Coffee Consumed", value: "∞ Cups" },
            { icon: Code2, label: "Projects Built", value: "50+" },
          ].map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.label}
                  </p>
                  <p className="font-semibold font-mono">{item.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Experience Section */}
        <motion.div className="mb-16" variants={itemVariants}>
          <motion.h2
            className="text-3xl font-bold mb-8 text-center font-mono"
            variants={itemVariants}
          >
            &lt;Experience /&gt;
          </motion.h2>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl mb-1">
                          {exp.title}
                        </CardTitle>
                        <p className="text-primary font-semibold">
                          {exp.company}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit mt-2 md:mt-0">
                        {exp.period}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {exp.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech) => (
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
          </div>
        </motion.div>

        {/* Interests Section */}
        <motion.div className="mb-16" variants={itemVariants}>
          <motion.h2
            className="text-3xl font-bold mb-8 text-center font-mono"
            variants={itemVariants}
          >
            &lt;Interests /&gt;
          </motion.h2>
          <motion.div
            className="flex flex-wrap gap-3 justify-center"
            variants={containerVariants}
          >
            {interests.map((interest, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {interest}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="text-center" variants={itemVariants}>
          <motion.h2
            className="text-2xl font-bold mb-4 font-mono"
            variants={itemVariants}
          >
            Let's Work Together
          </motion.h2>
          <motion.p
            className="text-muted-foreground mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            I'm always interested in new opportunities and exciting projects.
            Feel free to reach out if you'd like to collaborate!
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg">
                <Link href="/contact">Get In Touch</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="outline" size="lg">
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 w-4 h-4" />
                  Download Resume
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  );
}

const logEntry: DbTypes["public"]["Tables"]["admin_logs"]["Insert"] = {
  id: "uuid",
  created_at: "2023-10-05T10:00:00Z",
  table_name: "about_content",
  record_id: "uuid",
  action: "INSERT",
  old_data: null,
  new_data: {
    id: "uuid",
    section: "experience",
    title: "Senior Full-Stack Developer",
    content: "Leading development of scalable web applications using React, Next.js, and Node.js. Mentoring junior developers and architecting cloud solutions.",
    data: [
      "React",
      "Next.js",
      "TypeScript",
      "AWS",
      "PostgreSQL"
    ]
  }
};
