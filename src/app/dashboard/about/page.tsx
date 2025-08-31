"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Save, User, Briefcase, Heart } from "lucide-react";
import { createClient } from "../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { logClientAdminAction } from "@/app/actions";

interface AboutContent {
  id: string;
  section: string;
  title: string | null;
  content: string;
  data: any;
  created_at: string;
  updated_at: string;
}

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  technologies: string[];
}

export default function AboutManagement() {
  const [aboutContent, setAboutContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<AboutContent | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [formData, setFormData] = useState({
    section: "",
    title: "",
    content: "",
    data: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAboutContent();

    // Set up real-time subscription for about content
    const aboutSubscription = supabase
      .channel("about-dashboard-changes")
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

  const fetchAboutContent = async () => {
    try {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .order("section", { ascending: true });

      if (error) throw error;
      setAboutContent(data || []);
    } catch (error) {
      console.error("Error fetching about content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedData = null;
    if (formData.data.trim()) {
      try {
        parsedData = JSON.parse(formData.data);
      } catch (error) {
        alert("Invalid JSON format in data field");
        return;
      }
    }

    try {
      const contentData = {
        section: formData.section,
        title: formData.title || null,
        content: formData.content,
        data: parsedData,
        updated_at: new Date().toISOString(),
      };

      if (editingContent) {
        const { error } = await supabase
          .from("about_content")
          .update(contentData)
          .eq("id", editingContent.id);

        if (error) throw error;

        // Log the update action
        await logClientAdminAction(
          "UPDATE",
          `Updated about content section: ${contentData.section}`,
          "about_content",
          editingContent.id,
          editingContent,
          contentData,
        );
      } else {
        const { data: insertedData, error } = await supabase
          .from("about_content")
          .insert(contentData)
          .select()
          .single();

        if (error) throw error;

        // Log the create action
        await logClientAdminAction(
          "CREATE",
          `Created new about content section: ${contentData.section}`,
          "about_content",
          insertedData?.id,
          null,
          contentData,
        );
      }

      await fetchAboutContent();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving about content:", error);
    }
  };

  const handleEdit = (content: AboutContent) => {
    setEditingContent(content);
    setFormData({
      section: content.section,
      title: content.title || "",
      content: content.content,
      data: content.data ? JSON.stringify(content.data, null, 2) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Get the content before deleting for logging
      const contentToDelete = aboutContent.find((content) => content.id === id);

      const { error } = await supabase
        .from("about_content")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Log the delete action
      if (contentToDelete) {
        await logClientAdminAction(
          "DELETE",
          `Deleted about content section: ${contentToDelete.section}`,
          "about_content",
          id,
          contentToDelete,
          null,
        );
      }

      await fetchAboutContent();
    } catch (error) {
      console.error("Error deleting about content:", error);
    }
  };

  const resetForm = () => {
    setFormData({ section: "", title: "", content: "", data: "" });
    setEditingContent(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getContentBySection = (section: string) => {
    return aboutContent.find((content) => content.section === section);
  };

  const renderExperienceData = (data: Experience[]) => {
    return (
      <div className="space-y-4">
        {data.map((exp, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{exp.title}</h4>
                <p className="text-primary text-sm">{exp.company}</p>
              </div>
              <Badge variant="outline">{exp.period}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {exp.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {exp.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderInterestsData = (data: string[]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {data.map((interest, index) => (
          <Badge key={index} variant="outline" className="px-3 py-1">
            {interest}
          </Badge>
        ))}
      </div>
    );
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
          <h1 className="text-3xl font-bold font-mono">
            About Page Management
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 w-4 h-4" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContent ? "Edit Content" : "Add New Content"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    placeholder="e.g., hero, experience, interests"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Main content text..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="data">
                    Additional Data (JSON format, optional)
                  </Label>
                  <Textarea
                    id="data"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    placeholder='[{"title": "Job Title", "company": "Company Name"}]'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For experience: array of objects with title, company,
                    period, description, technologies
                    <br />
                    For interests: array of strings
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="mr-2 w-4 h-4" />
                    {editingContent ? "Update" : "Create"}
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Hero Section
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="interests" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Interests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="mt-6">
            {(() => {
              const heroContent = getContentBySection("hero");
              return heroContent ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{heroContent.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(heroContent)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Content
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this hero
                                content? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(heroContent.id)}
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
                    <p className="text-muted-foreground">
                      {heroContent.content}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No hero content found.
                  </p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, section: "hero" });
                      setIsDialogOpen(true);
                    }}
                  >
                    Add Hero Content
                  </Button>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            {(() => {
              const experienceContent = getContentBySection("experience");
              return experienceContent ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{experienceContent.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(experienceContent)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Content
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this experience
                                content? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(experienceContent.id)
                                }
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
                    <p className="text-muted-foreground mb-4">
                      {experienceContent.content}
                    </p>
                    {experienceContent.data &&
                      renderExperienceData(experienceContent.data)}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No experience content found.
                  </p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, section: "experience" });
                      setIsDialogOpen(true);
                    }}
                  >
                    Add Experience Content
                  </Button>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="interests" className="mt-6">
            {(() => {
              const interestsContent = getContentBySection("interests");
              return interestsContent ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{interestsContent.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(interestsContent)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Content
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this interests
                                content? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(interestsContent.id)
                                }
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
                    <p className="text-muted-foreground mb-4">
                      {interestsContent.content}
                    </p>
                    {interestsContent.data &&
                      renderInterestsData(interestsContent.data)}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No interests content found.
                  </p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, section: "interests" });
                      setIsDialogOpen(true);
                    }}
                  >
                    Add Interests Content
                  </Button>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
