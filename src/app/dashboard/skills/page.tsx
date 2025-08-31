"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { createClient } from "../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { logClientAdminAction } from "@/app/actions";

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Frontend",
  "Backend",
  "Language",
  "Framework",
  "Styling",
  "Database",
  "Animation",
  "Tools",
  "DevOps",
  "Cloud",
];

const predefinedSkills = [
  // Programming Languages
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "PHP",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Ruby",
  "Scala",
  "Dart",
  // Frontend Technologies
  "HTML",
  "CSS",
  "React",
  "Vue.js",
  "Angular",
  "Svelte",
  "Next.js",
  "Nuxt.js",
  "Gatsby",
  "jQuery",
  "Bootstrap",
  "Tailwind CSS",
  "Sass",
  "Less",
  // Backend Technologies
  "Node.js",
  "Express.js",
  "Django",
  "Flask",
  "FastAPI",
  "Spring Boot",
  "Laravel",
  "CodeIgniter",
  "Ruby on Rails",
  "ASP.NET",
  "Gin",
  "Fiber",
  // Databases
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Oracle",
  "SQL Server",
  "Cassandra",
  "DynamoDB",
  "Firebase",
  "Supabase",
  // Cloud & DevOps
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitLab CI",
  "GitHub Actions",
  "Terraform",
  "Ansible",
  // Tools & Others
  "Git",
  "Webpack",
  "Vite",
  "Babel",
  "ESLint",
  "Prettier",
  "Jest",
  "Cypress",
  "Selenium",
  "Postman",
  "Figma",
  "Adobe XD",
  // Mobile Development
  "React Native",
  "Flutter",
  "Ionic",
  "Xamarin",
  "Android Studio",
  "Xcode",
  // Animation & Graphics
  "Framer Motion",
  "GSAP",
  "Three.js",
  "D3.js",
  "Chart.js",
  "Lottie",
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

export default function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: 50,
    category: "",
  });
  const [useCustomName, setUseCustomName] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchSkills();

    // Set up real-time subscription for skills
    const skillsSubscription = supabase
      .channel("skills-dashboard-changes")
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

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("category", { ascending: true })
        .order("level", { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSkill) {
        const skillData = {
          name: formData.name,
          level: formData.level,
          category: formData.category,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("skills")
          .update(skillData)
          .eq("id", editingSkill.id);

        if (error) throw error;

        // Log the update action
        await logClientAdminAction(
          "UPDATE",
          `Updated skill: ${formData.name}`,
          "skills",
          editingSkill.id,
          editingSkill,
          skillData,
        );
      } else {
        const skillData = {
          name: formData.name,
          level: formData.level,
          category: formData.category,
        };

        const { data: insertedData, error } = await supabase
          .from("skills")
          .insert(skillData)
          .select()
          .single();

        if (error) throw error;

        // Log the create action
        await logClientAdminAction(
          "CREATE",
          `Created new skill: ${formData.name}`,
          "skills",
          insertedData?.id,
          null,
          skillData,
        );
      }

      await fetchSkills();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving skill:", error);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      level: skill.level,
      category: skill.category,
    });
    // Check if the skill name is in predefined list
    setUseCustomName(!predefinedSkills.includes(skill.name));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Get the skill before deleting for logging
      const skillToDelete = skills.find((skill) => skill.id === id);

      const { error } = await supabase.from("skills").delete().eq("id", id);

      if (error) throw error;

      // Log the delete action
      if (skillToDelete) {
        await logClientAdminAction(
          "DELETE",
          `Deleted skill: ${skillToDelete.name}`,
          "skills",
          id,
          skillToDelete,
          null,
        );
      }

      await fetchSkills();
      setDeleteSkillId(null);
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", level: 50, category: "" });
    setEditingSkill(null);
    setUseCustomName(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono">Skills Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 w-4 h-4" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSkill ? "Edit Skill" : "Add New Skill"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Skill Name</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={!useCustomName ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomName(false);
                          setFormData({ ...formData, name: "" });
                        }}
                      >
                        Select from List
                      </Button>
                      <Button
                        type="button"
                        variant={useCustomName ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomName(true);
                          setFormData({ ...formData, name: "" });
                        }}
                      >
                        Custom Name
                      </Button>
                    </div>
                    {!useCustomName ? (
                      <Select
                        value={formData.name}
                        onValueChange={(value) =>
                          setFormData({ ...formData, name: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {predefinedSkills.map((skill) => (
                            <SelectItem key={skill} value={skill}>
                              {skill}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter custom skill name"
                        required
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">
                    Proficiency Level ({formData.level}%)
                  </Label>
                  <Input
                    id="level"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: parseInt(e.target.value),
                      })
                    }
                    className="mt-2"
                  />
                  <Progress value={formData.level} className="mt-2" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="mr-2 w-4 h-4" />
                    {editingSkill ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <Card key={skill.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {skill.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Skill</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{skill.name}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(skill.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Proficiency</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {skill.level}%
                      </span>
                      <Badge
                        className={`${getSkillColor(skill.level)} text-white text-xs`}
                      >
                        {getSkillLevel(skill.level)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {skills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No skills found. Add your first skill to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
