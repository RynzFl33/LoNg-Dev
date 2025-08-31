"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Send,
  Clock,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { submitContactMessage } from "../actions";
import { useSearchParams } from "next/navigation";
import { FormMessage, type Message } from "@/components/form-message";

interface ContactInfo {
  id: string;
  type: string;
  title: string;
  value: string;
  link: string | null;
  icon: string | null;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Handle URL search params for success/error messages
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  let formMessage: Message | null = null;
  if (error) {
    formMessage = { error };
  } else if (success) {
    formMessage = { success };
  } else if (message) {
    formMessage = { message };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      // Call the server action
      await submitContactMessage(formDataObj);

      // Show success toast
      toast({
        title: "Message Sent!",
        description: "Thank you for your message! We'll get back to you soon.",
        variant: "default",
      });

      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const mockContactInfo = [
    {
      id: "1",
      type: "email",
      icon: "Mail",
      title: "Email",
      value: "hello@example.com",
      link: "mailto:hello@example.com",
    },
    {
      id: "2",
      type: "phone",
      icon: "Phone",
      title: "Phone",
      value: "+1 (555) 123-4567",
      link: "tel:+15551234567",
    },
    {
      id: "3",
      type: "location",
      icon: "MapPin",
      title: "Location",
      value: "San Francisco, CA",
      link: "#",
    },
    {
      id: "4",
      type: "response_time",
      icon: "Clock",
      title: "Response Time",
      value: "Within 24 hours",
      link: "#",
    },
  ];

  const getIconComponent = (iconName: string | null) => {
    switch (iconName) {
      case "Mail":
        return Mail;
      case "Phone":
        return Phone;
      case "MapPin":
        return MapPin;
      case "Clock":
        return Clock;
      case "Github":
        return Github;
      case "Linkedin":
        return Linkedin;
      case "Twitter":
        return Twitter;
      default:
        return Mail;
    }
  };

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("contact_info")
          .select("*")
          .order("type", { ascending: true });

        if (error) {
          console.log("No contact_info table found, using mock data");
          setContactInfo(mockContactInfo);
        } else {
          setContactInfo(data || mockContactInfo);
        }
      } catch (err) {
        console.log("Using mock data:", err);
        setContactInfo(mockContactInfo);
      }
    };

    fetchContactInfo();

    // Set up real-time subscription for contact info
    const contactSubscription = supabase
      .channel("contact-info-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_info",
        },
        () => {
          fetchContactInfo();
        },
      )
      .subscribe();

    return () => {
      contactSubscription.unsubscribe();
    };
  }, []);

  const socialLinks = [
    {
      icon: Github,
      name: "GitHub",
      url: "https://github.com",
      color: "hover:text-gray-900 dark:hover:text-gray-100",
    },
    {
      icon: Linkedin,
      name: "LinkedIn",
      url: "https://linkedin.com",
      color: "hover:text-blue-600",
    },
    {
      icon: Twitter,
      name: "Twitter",
      url: "https://twitter.com",
      color: "hover:text-blue-400",
    },
  ];

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
          {formMessage && (
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FormMessage message={formMessage} />
            </motion.div>
          )}
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 font-mono"
            variants={itemVariants}
          >
            &lt;Contact /&gt;
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Have a project in mind or just want to chat? I'd love to hear from
            you. Let's create something amazing together.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-mono">
                  Send Me a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell me about your project or just say hello!"
                      rows={6}
                      required
                    />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 w-4 h-4" />
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* Contact Details */}
            <div>
              <h2 className="text-2xl font-bold mb-6 font-mono">
                Get In Touch
              </h2>
              <div className="grid gap-4">
                {contactInfo.map((info, index) => {
                  const IconComponent = getIconComponent(info.icon);
                  return (
                    <motion.div
                      key={info.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center p-4">
                          <div className="mr-4 p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{info.title}</p>
                            <p className="text-muted-foreground text-sm">
                              {info.value}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold mb-4 font-mono">
                Connect With Me
              </h3>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-lg bg-muted text-muted-foreground transition-colors ${social.color}`}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="w-6 h-6" />
                    <span className="sr-only">{social.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-mono">
                  Current Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Available for new projects
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  I'm currently accepting new freelance projects and full-time
                  opportunities. Let's discuss how we can work together!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <Footer />
      <Toaster />
    </div>
  );
}
