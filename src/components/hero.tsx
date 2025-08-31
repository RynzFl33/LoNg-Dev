"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Github,
  Linkedin,
  Mail,
  Code2,
  Terminal,
  Sparkles,
} from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { createClient } from "../../supabase/client";

interface HomeContent {
  id: string;
  section: string;
  title: string | null;
  content: string;
  data: any;
}

export default function Hero() {
  const controls = useAnimation();
  const [homeContent, setHomeContent] = useState<HomeContent[]>([]);
  const supabase = createClient();

  useEffect(() => {
    controls.start({
      y: [0, 10],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        type: "tween",
      },
    });

    // Fetch home content
    const fetchHomeContent = async () => {
      try {
        const { data, error } = await supabase
          .from("home_content")
          .select("*")
          .order("section", { ascending: true });

        if (error) {
          console.log("No home content found, using defaults");
        } else {
          setHomeContent(data || []);
        }
      } catch (err) {
        console.log("Using default content:", err);
      }
    };

    fetchHomeContent();

    // Set up real-time subscription for home content
    const homeContentSubscription = supabase
      .channel("home-content-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "home_content",
        },
        () => {
          fetchHomeContent();
        },
      )
      .subscribe();

    return () => {
      homeContentSubscription.unsubscribe();
    };
  }, [controls, supabase]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, 20],
      x: [0, 10],
      rotate: [0, 360],
      transition: {
        y: {
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          type: "tween",
        },
        x: {
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          type: "tween",
        },
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          type: "tween",
        },
      },
    },
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.5],
      opacity: [0.3, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        type: "tween",
      },
    },
  };

  // Helper function to get content by section
  const getContent = (section: string, defaultValue: string) => {
    const content = homeContent.find((item) => item.section === section);
    return content ? content.content : defaultValue;
  };

  // Helper function to get data by section
  const getData = (section: string, key: string, defaultValue: any) => {
    const content = homeContent.find((item) => item.section === section);
    return content?.data?.[key] || defaultValue;
  };

  // Get social links
  const socialLinks = [
    {
      href: getContent("hero_social_github", "https://github.com"),
      icon: Github,
    },
    {
      href: getContent("hero_social_linkedin", "https://linkedin.com"),
      icon: Linkedin,
    },
    {
      href: getContent("hero_social_email", "mailto:hello@example.com"),
      icon: Mail,
    },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Enhanced Grid background with animation */}
      <motion.div
        className="absolute inset-0 bg-grid-pattern opacity-5"
        animate={{
          opacity: [0.05, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          type: "tween",
        }}
      />

      {/* Enhanced animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-3 h-3 bg-primary/30 rounded-full"
          variants={sparkleVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-20 w-2 h-2 bg-primary/40 rounded-full"
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-2.5 h-2.5 bg-primary/35 rounded-full"
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: 1 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full"
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: 1.5 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-primary/30 rounded-full"
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: 2 }}
        />

        {/* Floating code symbols */}
        <motion.div
          className="absolute top-1/4 left-1/3 text-primary/20 text-2xl font-mono"
          variants={floatingVariants}
          animate="animate"
        >
          {"{}"}
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 right-1/3 text-primary/20 text-xl font-mono"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 1 }}
        >
          {"</>"}
        </motion.div>
      </div>

      <motion.div
        className="relative container mx-auto px-4 py-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-mono mb-6 border border-primary/20"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(var(--primary), 0.3)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Terminal className="w-4 h-4" />
              </motion.div>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {getContent("hero_greeting", 'console.log("Hello, World!")')}
              </motion.span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
              variants={itemVariants}
            >
              Hi, I'm{" "}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  type: "tween",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                {getContent("hero_name", "LoNg")}
              </motion.span>
            </motion.h1>

            <div className="text-xl sm:text-2xl text-muted-foreground mb-8 font-mono">
              <motion.span variants={itemVariants} className="block">
                {getContent("hero_title", "Full-Stack Developer")}
              </motion.span>
              <motion.span
                variants={itemVariants}
                className="block text-lg mt-2"
              >
                {getContent(
                  "hero_subtitle",
                  "Building digital experiences with modern technologies",
                )}
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(var(--primary), 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                asChild
                size="lg"
                className="font-mono relative overflow-hidden group"
              >
                <Link href={getData("hero_cta_primary", "href", "#projects")}>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Code2 className="mr-2 w-4 h-4" />
                  {getContent("hero_cta_primary", "View My Work")}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.05,
                borderColor: "var(--primary)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button asChild variant="outline" size="lg" className="font-mono">
                <Link href={getData("hero_cta_secondary", "href", "/contact")}>
                  <Mail className="mr-2 w-4 h-4" />
                  {getContent("hero_cta_secondary", "Get In Touch")}
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-6"
          >
            {socialLinks.map(({ href, icon: Icon }, index) => (
              <motion.a
                key={href}
                href={href}
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full"
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel={
                  href.startsWith("mailto") ? undefined : "noopener noreferrer"
                }
                whileHover={{
                  scale: 1.2,
                  rotate: 5,
                  backgroundColor: "rgba(var(--primary), 0.1)",
                }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  y: [-5, 5],
                }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: index * 0.2,
                    type: "tween",
                  },
                  scale: {
                    type: "spring",
                    stiffness: 300,
                  },
                  rotate: {
                    type: "spring",
                    stiffness: 300,
                  },
                  backgroundColor: {
                    type: "spring",
                    stiffness: 300,
                  },
                }}
              >
                <Icon className="w-6 h-6" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
