"use client";

import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../supabase/client";

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

const mockSkills = [
  { id: "1", name: "React", level: 95, category: "Frontend" },
  { id: "2", name: "TypeScript", level: 90, category: "Language" },
  { id: "3", name: "Next.js", level: 88, category: "Framework" },
  { id: "4", name: "Node.js", level: 85, category: "Backend" },
  { id: "5", name: "Tailwind CSS", level: 92, category: "Styling" },
  { id: "6", name: "PostgreSQL", level: 80, category: "Database" },
  { id: "7", name: "Supabase", level: 85, category: "Backend" },
  { id: "8", name: "Framer Motion", level: 78, category: "Animation" },
  { id: "9", name: "Git", level: 88, category: "Tools" },
  { id: "10", name: "Docker", level: 75, category: "DevOps" },
  { id: "11", name: "AWS", level: 70, category: "Cloud" },
  { id: "12", name: "Python", level: 82, category: "Language" },
];

const getSkillColor = (level: number) => {
  if (level >= 90) return "bg-green-500";
  if (level >= 80) return "bg-blue-500";
  if (level >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

const getSkillLevel = (level: number) => {
  if (level >= 90) return "Expert";
  if (level >= 80) return "Advanced";
  if (level >= 70) return "Intermediate";
  return "Beginner";
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (level: number) => ({
    width: `${level}%`,
    transition: {
      duration: 1.5,
      ease: "easeOut",
      delay: 0.5,
    },
  }),
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(mockSkills);
  const [animateProgress, setAnimateProgress] = useState(false);
  const supabase = createClient();
  const skillsRef = useRef(null);
  const isInView = useInView(skillsRef, { once: true, threshold: 0.1 });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const { data, error } = await supabase
          .from("skills")
          .select("*")
          .order("category", { ascending: true })
          .order("level", { ascending: false });

        if (error) {
          console.log("No skills table found, using mock data");
          setSkills(mockSkills);
        } else {
          setSkills(data || mockSkills);
        }
      } catch (err) {
        console.log("Using mock data:", err);
        setSkills(mockSkills);
      }
    };

    fetchSkills();

    // Set up real-time subscription for skills
    const skillsSubscription = supabase
      .channel("skills-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "skills",
        },
        () => {
          fetchSkills();
        },
      )
      .subscribe();

    return () => {
      skillsSubscription.unsubscribe();
    };
  }, []);

  // Trigger progress animation when skills section comes into view
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setAnimateProgress(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Skills & Expertise
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of my technical skills and proficiency
            levels across various technologies and tools.
          </p>
        </motion.div>

        <motion.div
          ref={skillsRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {skills.map((skill, index) => (
            <motion.div
              key={skill.id}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                y: -5,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-card border rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <motion.h3
                    className="text-lg font-semibold group-hover:text-primary transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {skill.name}
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs mt-1 group-hover:bg-primary/10 transition-colors"
                    >
                      {skill.category}
                    </Badge>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: index * 0.1 + 0.4,
                  }}
                >
                  <Badge
                    className={`${getSkillColor(skill.level)} text-white group-hover:scale-110 transition-transform`}
                  >
                    {getSkillLevel(skill.level)}
                  </Badge>
                </motion.div>
              </div>

              <div className="space-y-2">
                <motion.div
                  className="flex justify-between text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <span>Proficiency</span>
                  <motion.span
                    className="font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.7 }}
                  >
                    {skill.level}%
                  </motion.span>
                </motion.div>
                <div className="relative overflow-hidden rounded-full bg-primary/20 h-2">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={
                      animateProgress
                        ? { width: `${skill.level}%` }
                        : { width: 0 }
                    }
                    transition={{
                      duration: 1.2,
                      ease: "easeOut",
                      delay: index * 0.1 + 0.8,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.5,
            type: "spring",
            stiffness: 100,
          }}
          className="mt-16 text-center"
        >
          <motion.h2
            className="text-2xl font-bold mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            Continuous Learning
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.6 }}
          >
            I'm always expanding my skill set and staying up-to-date with the
            latest technologies. Currently exploring AI/ML integration, advanced
            cloud architectures, and modern development practices.
          </motion.p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
