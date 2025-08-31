"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  User,
  Database,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Edit,
  Plus,
  Shield,
  Users,
  Mail,
  Calendar,
  UserPlus,
  Save,
  X,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";
import { Tables } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/app/actions";

type AdminLog = Tables<"admin_logs">;
type AdminUser = Tables<"users">;

const actionIcons: Record<string, any> = {
  LOGIN: Shield,
  LOGOUT: Shield,
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  MESSAGE_RECEIVED: Info,
  VIEW: Eye,
  DEFAULT: Activity,
};

const actionColors: Record<string, string> = {
  LOGIN: "bg-green-500/10 text-green-500 border-green-500/20",
  LOGOUT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  CREATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  UPDATE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  MESSAGE_RECEIVED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  VIEW: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  DEFAULT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function AdminPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("action", filter);
      }

      if (searchTerm) {
        query = query.or(
          `action.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching admin users:", error);
        return;
      }

      setAdminUsers(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchAdminUsers();
  }, [filter, searchTerm]);

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel("admin_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_logs",
        },
        (payload) => {
          setLogs((current) => [
            payload.new as AdminLog,
            ...current.slice(0, 99),
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    const IconComponent = actionIcons[action] || actionIcons.DEFAULT;
    return <IconComponent className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || actionColors.DEFAULT;
  };

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    await createAdminUser(formData);

    setIsSubmitting(false);
    setIsCreateDialogOpen(false);
    // Refresh both users and logs
    fetchAdminUsers();
    fetchLogs();
  };

  const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    if (editingUser) {
      formData.append("userId", editingUser.id);
    }
    await updateAdminUser(formData);

    setIsSubmitting(false);
    setIsEditDialogOpen(false);
    setEditingUser(null);
    // Refresh both users and logs
    fetchAdminUsers();
    fetchLogs();
  };

  const handleDeleteUser = async (userId: string) => {
    const formData = new FormData();
    formData.append("userId", userId);
    await deleteAdminUser(formData);
    // Refresh both users and logs
    fetchAdminUsers();
    fetchLogs();
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="p-6">
        <motion.div
          className="max-w-7xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-primary/10 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-6 h-6 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold font-mono">
                  &lt;Admin Logs /&gt;
                </h1>
                <p className="text-muted-foreground">
                  Monitor all administrative activities and system events
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  fetchLogs();
                  fetchAdminUsers();
                }}
                disabled={loading || usersLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading || usersLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Logs
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Actions
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    logs.filter(
                      (log) =>
                        new Date(log.created_at).toDateString() ===
                        new Date().toDateString(),
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Actions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueActions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(logs.map((log) => log.user_id)).size}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="flex flex-col md:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </motion.div>

          {/* Admin Users Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Admin Users
                  </CardTitle>
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5" />
                          Create New Admin User
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-email">Email</Label>
                          <Input
                            id="create-email"
                            name="email"
                            type="email"
                            placeholder="admin@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-password">Password</Label>
                          <Input
                            id="create-password"
                            name="password"
                            type="password"
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-fullName">Full Name</Label>
                          <Input
                            id="create-fullName"
                            name="fullName"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-name">Display Name</Label>
                          <Input
                            id="create-name"
                            name="name"
                            placeholder="John (optional)"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Create Admin
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No admin users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminUsers.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  {user.avatar_url ? (
                                    <img
                                      src={user.avatar_url}
                                      alt={
                                        user.full_name || user.name || "User"
                                      }
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {user.full_name || user.name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    ID: {user.id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {user.email || "No email"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1 w-fit"
                              >
                                <Shield className="w-3 h-3" />
                                Admin
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {user.updated_at
                                  ? new Date(
                                      user.updated_at,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Admin User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete{" "}
                                        {user.full_name || user.name}? This
                                        action cannot be undone and will
                                        permanently remove their admin access.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteUser(user.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Admin User
                </DialogTitle>
              </DialogHeader>
              {editingUser && (
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      defaultValue={editingUser.email || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">
                      New Password (optional)
                    </Label>
                    <Input
                      id="edit-password"
                      name="password"
                      type="password"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Full Name</Label>
                    <Input
                      id="edit-fullName"
                      name="fullName"
                      defaultValue={editingUser.full_name || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Display Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingUser.name || ""}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingUser(null);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Update Admin
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Console Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Logs
                  <Badge variant="secondary" className="ml-2 font-mono text-xs">
                    console.log()
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="console-log">
                    <div className="console-log-entry">
                      <span className="console-timestamp">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span
                        className="console-action"
                        style={{ color: "#7d8590" }}
                      >
                        INFO
                      </span>
                      <span className="console-description">
                        No logs found matching your criteria.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="console-log max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        className="console-log-entry cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <span className="console-timestamp">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        <span className={`console-action ${log.action}`}>
                          {log.action}
                        </span>
                        <span className="console-description">
                          {log.description || "No description"}
                        </span>
                        {log.table_name && (
                          <span className="console-table">
                            {log.table_name}
                          </span>
                        )}
                        {log.record_id && (
                          <span className="console-id ml-2">
                            #{log.record_id.slice(0, 8)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Log Details Dialog */}
          <Dialog
            open={!!selectedLog}
            onOpenChange={() => setSelectedLog(null)}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono">
                  <Activity className="w-5 h-5" />
                  console.log() - {selectedLog?.action}
                </DialogTitle>
              </DialogHeader>
              {selectedLog && (
                <div className="console-log">
                  <div className="console-log-entry border-b-0">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          ACTION
                        </label>
                        <span
                          className={`console-action ${selectedLog.action} text-sm`}
                        >
                          {selectedLog.action}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          TIMESTAMP
                        </label>
                        <span className="text-sm text-gray-300">
                          {formatDate(selectedLog.created_at)}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          TABLE
                        </label>
                        <span className="console-table">
                          {selectedLog.table_name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          RECORD_ID
                        </label>
                        <span className="console-id text-sm">
                          {selectedLog.record_id || "N/A"}
                        </span>
                      </div>
                    </div>

                    {selectedLog.description && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          DESCRIPTION
                        </label>
                        <span className="console-description text-sm">
                          {selectedLog.description}
                        </span>
                      </div>
                    )}

                    {selectedLog.ip_address && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          IP_ADDRESS
                        </label>
                        <span className="text-sm text-gray-300 font-mono">
                          {selectedLog.ip_address}
                        </span>
                      </div>
                    )}

                    {selectedLog.user_agent && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-400 block mb-1">
                          USER_AGENT
                        </label>
                        <span className="text-xs text-gray-400 font-mono break-all">
                          {selectedLog.user_agent}
                        </span>
                      </div>
                    )}

                    {(selectedLog.old_data || selectedLog.new_data) && (
                      <div className="space-y-4">
                        {selectedLog.old_data && (
                          <div>
                            <label className="text-xs font-medium text-gray-400 block mb-2">
                              OLD_DATA
                            </label>
                            <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs overflow-auto text-red-300">
                              {JSON.stringify(selectedLog.old_data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedLog.new_data && (
                          <div>
                            <label className="text-xs font-medium text-gray-400 block mb-2">
                              NEW_DATA
                            </label>
                            <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs overflow-auto text-green-300">
                              {JSON.stringify(selectedLog.new_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}
