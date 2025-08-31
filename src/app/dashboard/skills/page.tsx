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
        const { error } = await supabase
          .from("skills")
          .update({
            name: formData.name,
            level: formData.level,
            category: formData.category,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSkill.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("skills").insert({
          name: formData.name,
          level: formData.level,
          category: formData.category,
        });

        if (error) throw error;
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("skills").delete().eq("id", id);

      if (error) throw error;
      await fetchSkills();
      setDeleteSkillId(null);
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", level: 50, category: "" });
    setEditingSkill(null);
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
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., React"
                    required
                  />
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
