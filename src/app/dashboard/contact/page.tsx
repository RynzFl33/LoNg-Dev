"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Mail,
  Phone,
  MapPin,
  Clock,
  Github,
  Linkedin,
  Twitter,
  MessageSquare,
  Eye,
  CheckCircle,
  Circle,
  Calendar,
  Reply,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { logClientAdminAction } from "@/app/actions";

interface ContactInfo {
  id: string;
  type: string;
  title: string;
  value: string;
  link: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const contactTypes = [
  { value: "email", label: "Email", icon: "Mail" },
  { value: "phone", label: "Phone", icon: "Phone" },
  { value: "location", label: "Location", icon: "MapPin" },
  { value: "response_time", label: "Response Time", icon: "Clock" },
  { value: "github", label: "GitHub", icon: "Github" },
  { value: "linkedin", label: "LinkedIn", icon: "Linkedin" },
  { value: "twitter", label: "Twitter", icon: "Twitter" },
  { value: "website", label: "Website", icon: "Globe" },
  { value: "other", label: "Other", icon: "Info" },
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

export default function ContactManagement() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(
    null,
  );
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    value: "",
    link: "",
    icon: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchContactInfo();
    fetchMessages();

    // Set up real-time subscription for contact info
    const contactSubscription = supabase
      .channel("contact-dashboard-changes")
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

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel("messages-dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMessages();
        },
      )
      .subscribe();

    return () => {
      contactSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("type", { ascending: true });

      if (error) throw error;
      setContactInfo(data || []);
    } catch (error) {
      console.error("Error fetching contact info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const contactData = {
        type: formData.type,
        title: formData.title,
        value: formData.value,
        link: formData.link || null,
        icon: formData.icon || null,
        updated_at: new Date().toISOString(),
      };

      if (editingContact) {
        const { error } = await supabase
          .from("contact_info")
          .update(contactData)
          .eq("id", editingContact.id);

        if (error) throw error;

        // Log the update action
        await logClientAdminAction(
          "UPDATE",
          `Updated contact info: ${contactData.title}`,
          "contact_info",
          editingContact.id,
          editingContact,
          contactData,
        );
      } else {
        const { data: insertedData, error } = await supabase
          .from("contact_info")
          .insert(contactData)
          .select()
          .single();

        if (error) throw error;

        // Log the create action
        await logClientAdminAction(
          "CREATE",
          `Created new contact info: ${contactData.title}`,
          "contact_info",
          insertedData?.id,
          null,
          contactData,
        );
      }

      await fetchContactInfo();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving contact info:", error);
    }
  };

  const handleEdit = (contact: ContactInfo) => {
    setEditingContact(contact);
    setFormData({
      type: contact.type,
      title: contact.title,
      value: contact.value,
      link: contact.link || "",
      icon: contact.icon || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact info?")) return;

    try {
      // Get the contact info before deleting for logging
      const contactToDelete = contactInfo.find((contact) => contact.id === id);

      const { error } = await supabase
        .from("contact_info")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Log the delete action
      if (contactToDelete) {
        await logClientAdminAction(
          "DELETE",
          `Deleted contact info: ${contactToDelete.title}`,
          "contact_info",
          id,
          contactToDelete,
          null,
        );
      }

      await fetchContactInfo();
    } catch (error) {
      console.error("Error deleting contact info:", error);
    }
  };

  const resetForm = () => {
    setFormData({ type: "", title: "", value: "", link: "", icon: "" });
    setEditingContact(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleTypeChange = (type: string) => {
    const selectedType = contactTypes.find((t) => t.value === type);
    setFormData({
      ...formData,
      type,
      title: selectedType?.label || "",
      icon: selectedType?.icon || "",
    });
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsMessageDialogOpen(true);

    // Mark as read if it's unread
    if (message.status === "unread") {
      handleMarkAsRead(message.id);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const messageToUpdate = messages.find((msg) => msg.id === messageId);

      const { error } = await supabase
        .from("messages")
        .update({ status: "read", updated_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      // Log the update action
      if (messageToUpdate) {
        await logClientAdminAction(
          "UPDATE",
          `Marked message as read from: ${messageToUpdate.name}`,
          "messages",
          messageId,
          messageToUpdate,
          { ...messageToUpdate, status: "read" },
        );
      }

      await fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      // Get the message before deleting for logging
      const messageToDelete = messages.find((msg) => msg.id === messageId);

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      // Log the delete action
      if (messageToDelete) {
        await logClientAdminAction(
          "DELETE",
          `Deleted message from: ${messageToDelete.name} (${messageToDelete.email})`,
          "messages",
          messageId,
          messageToDelete,
          null,
        );
      }

      await fetchMessages();

      // Close dialog if the deleted message was being viewed
      if (selectedMessage?.id === messageId) {
        setIsMessageDialogOpen(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleReplyToMessage = (message: Message) => {
    // Create a mailto link with pre-filled content
    const subject = `Re: ${message.subject || "Your message"}`;
    const body = `Hi ${message.name},\n\nThank you for your message:\n\n"${message.message}"\n\nBest regards,`;
    const mailtoLink = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the default email client
    window.open(mailtoLink, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "read":
        return "secondary";
      case "unread":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading || messagesLoading) {
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
          <h1 className="text-3xl font-bold font-mono">Contact Management</h1>
        </div>

        <Tabs defaultValue="contact-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="contact-info"
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages ({
                messages.filter((m) => m.status === "unread").length
              }{" "}
              unread)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact-info" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-mono">
                Contact Information
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 w-4 h-4" />
                    Add Contact Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact
                        ? "Edit Contact Info"
                        : "Add New Contact Info"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={handleTypeChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., Email, Phone"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="value">Value</Label>
                      <Input
                        id="value"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({ ...formData, value: e.target.value })
                        }
                        placeholder="e.g., hello@example.com, +1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="link">Link (Optional)</Label>
                      <Input
                        id="link"
                        value={formData.link}
                        onChange={(e) =>
                          setFormData({ ...formData, link: e.target.value })
                        }
                        placeholder="e.g., mailto:hello@example.com, tel:+15551234567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon Name</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) =>
                          setFormData({ ...formData, icon: e.target.value })
                        }
                        placeholder="e.g., Mail, Phone, MapPin"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Save className="mr-2 w-4 h-4" />
                        {editingContact ? "Update" : "Create"}
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
              {contactInfo.map((contact) => {
                const IconComponent = getIconComponent(contact.icon);
                return (
                  <Card
                    key={contact.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {contact.title}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {contact.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-2">
                        {contact.value}
                      </p>
                      {contact.link && (
                        <a
                          href={contact.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          {contact.link}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {contactInfo.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No contact information found. Add your first contact info to
                  get started!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-mono">
                Contact Messages
              </h2>
              <Badge variant="outline" className="text-sm">
                {messages.length} total messages
              </Badge>
            </div>

            {messages.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Received Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow
                          key={message.id}
                          className={
                            message.status === "unread" ? "bg-muted/30" : ""
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {message.status === "unread" ? (
                                <Circle className="w-4 h-4 text-blue-500 fill-current" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <Badge
                                variant={getStatusBadgeVariant(message.status)}
                                className="text-xs"
                              >
                                {message.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {message.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {message.email}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {message.subject || "No subject"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(message.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMessage(message)}
                                title="View message"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReplyToMessage(message)}
                                title="Reply to message"
                              >
                                <Reply className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMessage(message.id)}
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-4">
                  No messages received yet.
                </p>
                <p className="text-muted-foreground text-sm">
                  Messages from your contact form will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Message View Dialog */}
        <Dialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Message from {selectedMessage?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Name
                    </Label>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Subject
                  </Label>
                  <p className="font-medium">
                    {selectedMessage.subject || "No subject"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p className="font-medium">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Message
                  </Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsMessageDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleReplyToMessage(selectedMessage)}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteMessage(selectedMessage.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
