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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Home,
  Terminal,
  User,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { logClientAdminAction } from "@/app/actions";

interface HomeContent {
  id: string;
  section: string;
  title: string | null;
  content: string;
  data: any;
  created_at: string;
  updated_at: string;
}

const sectionTypes = [
  { value: "hero_greeting", label: "Hero Greeting", icon: Terminal },
  { value: "hero_name", label: "Developer Name", icon: User },
  { value: "hero_title", label: "Main Title", icon: MessageSquare },
  { value: "hero_subtitle", label: "Subtitle", icon: MessageSquare },
  { value: "hero_cta_primary", label: "Primary CTA", icon: LinkIcon },
  { value: "hero_cta_secondary", label: "Secondary CTA", icon: LinkIcon },
  { value: "hero_social_github", label: "GitHub Link", icon: LinkIcon },
  { value: "hero_social_linkedin", label: "LinkedIn Link", icon: LinkIcon },
  { value: "hero_social_email", label: "Email Link", icon: LinkIcon },
];

const getSectionColor = (section: string) => {
  if (section.includes("greeting")) return "bg-blue-50 dark:bg-blue-950/20";
  if (section.includes("name")) return "bg-purple-50 dark:bg-purple-950/20";
  if (section.includes("title") || section.includes("subtitle"))
    return "bg-green-50 dark:bg-green-950/20";
  if (section.includes("cta")) return "bg-orange-50 dark:bg-orange-950/20";
  if (section.includes("social")) return "bg-pink-50 dark:bg-pink-950/20";
  return "bg-gray-50 dark:bg-gray-950/20";
};

const getSectionIcon = (section: string) => {
  const sectionType = sectionTypes.find((type) => type.value === section);
  return sectionType ? sectionType.icon : MessageSquare;
};

export default function HomeManagement() {
  const [homeContent, setHomeContent] = useState<HomeContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<HomeContent | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    section: "",
    title: "",
    content: "",
    data: "{}",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchHomeContent();

    // Set up real-time subscription for home content
    const homeContentSubscription = supabase
      .channel("home-content-dashboard-changes")
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
  }, []);

  const fetchHomeContent = async () => {
    try {
      const { data, error } = await supabase
        .from("home_content")
        .select("*")
        .order("section", { ascending: true });

      if (error) throw error;
      setHomeContent(data || []);
    } catch (error) {
      console.error("Error fetching home content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(formData.data);
      } catch {
        parsedData = {};
      }

      const contentData = {
        section: formData.section,
        title: formData.title || null,
        content: formData.content,
        data: parsedData,
        updated_at: new Date().toISOString(),
      };

      if (editingContent) {
        const { error } = await supabase
          .from("home_content")
          .update(contentData)
          .eq("id", editingContent.id);

        if (error) throw error;

        // Log the update action
        await logClientAdminAction(
          "UPDATE",
          `Updated home content section: ${contentData.section}`,
          "home_content",
          editingContent.id,
          editingContent,
          contentData,
        );
      } else {
        const { data: insertedData, error } = await supabase
          .from("home_content")
          .insert(contentData)
          .select()
          .single();

        if (error) throw error;

        // Log the create action
        await logClientAdminAction(
          "CREATE",
          `Created new home content section: ${contentData.section}`,
          "home_content",
          insertedData?.id,
          null,
          contentData,
        );
      }

      await fetchHomeContent();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving home content:", error);
    }
  };

  const handleEdit = (content: HomeContent) => {
    setEditingContent(content);
    setFormData({
      section: content.section,
      title: content.title || "",
      content: content.content,
      data: JSON.stringify(content.data || {}, null, 2),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Get the content before deleting for logging
      const contentToDelete = homeContent.find((content) => content.id === id);

      const { error } = await supabase
        .from("home_content")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Log the delete action
      if (contentToDelete) {
        await logClientAdminAction(
          "DELETE",
          `Deleted home content section: ${contentToDelete.section}`,
          "home_content",
          id,
          contentToDelete,
          null,
        );
      }

      await fetchHomeContent();
    } catch (error) {
      console.error("Error deleting home content:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      section: "",
      title: "",
      content: "",
      data: "{}",
    });
    setEditingContent(null);
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-mono">
                Home Page Management
              </h1>
              <p className="text-muted-foreground">
                Manage hero section and home page content
              </p>
            </div>
          </div>
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
                  {editingContent
                    ? "Edit Home Content"
                    : "Add New Home Content"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="section">Section Type</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) =>
                      setFormData({ ...formData, section: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Developer Name"
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
                    placeholder="Enter the content..."
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="data">Additional Data (JSON)</Label>
                  <Textarea
                    id="data"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    placeholder='{"icon": "terminal", "href": "#projects"}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valid JSON format. Used for icons, links, styling options,
                    etc.
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeContent.map((content) => {
            const Icon = getSectionIcon(content.section);
            return (
              <Card
                key={content.id}
                className={`hover:shadow-lg transition-shadow ${getSectionColor(content.section)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <CardTitle className="text-lg">
                          {content.title ||
                            content.section
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        {content.section}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(content)}
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
                            <AlertDialogTitle>Delete Content</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this home content
                              section? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(content.id)}
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
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Content:
                      </p>
                      <p className="text-sm bg-background/50 p-2 rounded border font-mono">
                        {content.content}
                      </p>
                    </div>
                    {content.data && Object.keys(content.data).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Additional Data:
                        </p>
                        <pre className="text-xs bg-background/50 p-2 rounded border font-mono overflow-x-auto">
                          {JSON.stringify(content.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Updated:{" "}
                      {new Date(content.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {homeContent.length === 0 && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">
              No home content found. Add your first content section to get
              started!
            </p>
            <p className="text-sm text-muted-foreground">
              Start by adding hero section elements like greeting, name, title,
              and call-to-action buttons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
