"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  Terminal,
  Code2,
  Database,
  Activity,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    skillsListed: 0,
    totalMessages: 0,
    lastUpdated: "Loading...",
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/sign-in";
        return;
      }
      setUser(user);
    };

    const fetchStats = async () => {
      try {
        // Fetch projects count
        const { count: projectsCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true });

        // Fetch skills count
        const { count: skillsCount } = await supabase
          .from("skills")
          .select("*", { count: "exact", head: true });

        // Fetch messages count
        const { count: messagesCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true });

        // Get last updated project
        const { data: lastProject } = await supabase
          .from("projects")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        const lastUpdated = lastProject
          ? new Date(lastProject.updated_at).toLocaleDateString()
          : "No data";

        setStats({
          totalProjects: projectsCount || 0,
          skillsListed: skillsCount || 0,
          totalMessages: messagesCount || 0,
          lastUpdated,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep default values if there's an error
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    fetchStats();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Manage Skills",
      description: "Add, edit, or remove your technical skills",
      href: "/dashboard/skills",
      icon: Code2,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Update Projects",
      description: "Showcase your latest work and projects",
      href: "/dashboard/projects",
      icon: Terminal,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Edit About",
      description: "Update your personal information and bio",
      href: "/dashboard/about",
      icon: UserCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Contact Info",
      description: "Manage your contact details and social links",
      href: "/dashboard/contact",
      icon: Database,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  const statsDisplay = [
    {
      label: "Total Projects",
      value: stats.totalProjects.toString(),
      icon: FileText,
      trend:
        stats.totalProjects > 0
          ? `${stats.totalProjects} active`
          : "No projects",
    },
    {
      label: "Skills Listed",
      value: stats.skillsListed.toString(),
      icon: Code2,
      trend:
        stats.skillsListed > 0 ? `${stats.skillsListed} skills` : "No skills",
    },
    {
      label: "Messages",
      value: stats.totalMessages.toString(),
      icon: Mail,
      trend:
        stats.totalMessages > 0
          ? `${stats.totalMessages} received`
          : "No messages",
    },
    {
      label: "Last Updated",
      value: stats.lastUpdated,
      icon: Clock,
      trend: "",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-mono">Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your portfolio content
                </p>
              </div>
            </div>
            <div className="bg-accent/50 border border-accent-foreground/10 text-sm p-4 rounded-lg text-muted-foreground flex gap-3 items-start">
              <InfoIcon size="16" className="mt-0.5 text-primary" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Admin Dashboard
                </p>
                <p>
                  Welcome back! Use this dashboard to manage all aspects of your
                  portfolio. Changes will be reflected on your public portfolio
                  immediately.
                </p>
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsDisplay.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold font-mono">
                          {stat.value}
                        </p>
                        {stat.trend && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {stat.trend}
                          </p>
                        )}
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.bgColor}`}>
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={action.href}>
                      <Button className="w-full font-mono group-hover:bg-primary/90 transition-colors">
                        Manage
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* User Profile Section */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <UserCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Admin Profile
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{user.email}</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono font-medium">
                    User Session Data
                  </span>
                </div>
                <div className="bg-background border rounded-md p-3 max-h-48 overflow-auto">
                  <pre className="text-xs font-mono text-muted-foreground">
                    {JSON.stringify(
                      {
                        id: user.id,
                        email: user.email,
                        created_at: user.created_at,
                        last_sign_in: user.last_sign_in_at,
                        role: "admin",
                        status: "active",
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
