"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { Tables } from "@/types/supabase";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Log failed login attempt
    await logAdminAction(
      "LOGIN_FAILED",
      `Failed login attempt for email: ${email} - ${error.message}`,
      "auth",
      null,
      null,
      { email, error: error.message },
    );
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (user) {
    // Check if user has admin role by checking the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      await supabase.auth.signOut();
      // Log access denied
      await logAdminAction(
        "LOGIN_DENIED",
        `Access denied for user: ${email} - Admin privileges required`,
        "auth",
        user.id,
        null,
        { email, reason: "No admin record found" },
      );
      return encodedRedirect(
        "error",
        "/sign-in",
        "Access denied. Admin privileges required.",
      );
    }

    // For now, we'll check if the user exists in the users table as admin verification
    // You can add a role column later if needed
    if (!userData.email || userData.email !== email) {
      await supabase.auth.signOut();
      // Log access denied
      await logAdminAction(
        "LOGIN_DENIED",
        `Access denied for user: ${email} - Email mismatch`,
        "auth",
        user.id,
        null,
        { email, userData, reason: "Email mismatch" },
      );
      return encodedRedirect(
        "error",
        "/sign-in",
        "Access denied. Admin privileges required.",
      );
    }

    // Log successful login
    await logAdminAction(
      "LOGIN",
      `Admin user logged in: ${userData.full_name || userData.name} (${email})`,
      "auth",
      user.id,
      null,
      { email, userId: user.id, loginTime: new Date().toISOString() },
    );
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();

  // Get user info before signing out for logging
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Get user details for logging
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Log the logout
    await logAdminAction(
      "LOGOUT",
      `Admin user logged out: ${userData?.full_name || userData?.name || "Unknown"} (${user.email})`,
      "auth",
      user.id,
      null,
      {
        email: user.email,
        userId: user.id,
        logoutTime: new Date().toISOString(),
      },
    );
  }

  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const logAdminAction = async (
  action: string,
  description?: string,
  tableName?: string,
  recordId?: string,
  oldData?: any,
  newData?: any,
) => {
  const supabase = await createClient();
  const headersList = headers();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("No authenticated user for admin action logging");
      return;
    }

    const logEntry: Tables<"admin_logs">["Insert"] = {
      user_id: user.id,
      action,
      description,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
      ip_address:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        null,
      user_agent: headersList.get("user-agent") || null,
    };

    const { error } = await supabase.from("admin_logs").insert(logEntry);

    if (error) {
      console.error("Error logging admin action:", error);
    }
  } catch (error) {
    console.error("Unexpected error logging admin action:", error);
  }
};

// Client-side logging function for dashboard actions
export const logClientAdminAction = async (
  action: string,
  description?: string,
  tableName?: string,
  recordId?: string,
  oldData?: any,
  newData?: any,
) => {
  // Only run on client-side
  if (typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch("/api/admin-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        description,
        tableName,
        recordId,
        oldData,
        newData,
      }),
    });

    if (!response.ok) {
      console.error("Failed to log admin action");
    }
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

export const submitContactMessage = async (formData: FormData) => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return encodedRedirect("error", "/contact", "All fields are required");
  }

  const supabase = await createClient();

  try {
    const { data: insertedMessage, error } = await supabase
      .from("messages")
      .insert({
        name,
        email,
        subject: subject || null,
        message,
        status: "unread",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting message:", error);
      return encodedRedirect(
        "error",
        "/contact",
        "Failed to send message. Please try again.",
      );
    }

    // Log the admin action
    await logAdminAction(
      "MESSAGE_RECEIVED",
      `New contact message received from ${name} (${email})`,
      "messages",
      insertedMessage?.id,
      null,
      insertedMessage,
    );

    return encodedRedirect(
      "success",
      "/contact",
      "Thank you for your message! We'll get back to you soon.",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return encodedRedirect(
      "error",
      "/contact",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const createAdminUser = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !fullName) {
    return encodedRedirect(
      "error",
      "/dashboard/admin",
      "All fields are required",
    );
  }

  const supabase = await createClient();

  try {
    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      // Log the failed attempt
      await logAdminAction(
        "CREATE_FAILED",
        `Failed to create admin user: ${email} - ${authError.message}`,
        "users",
        null,
        null,
        { email, fullName, error: authError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to create admin user: " + authError.message,
      );
    }

    if (!authData.user) {
      await logAdminAction(
        "CREATE_FAILED",
        `Failed to create admin user: ${email} - No user data returned`,
        "users",
        null,
        null,
        { email, fullName },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to create admin user",
      );
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        name: name || fullName,
        token_identifier: authData.user.id,
        user_id: authData.user.id,
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // Clean up auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      // Log the failed attempt
      await logAdminAction(
        "CREATE_FAILED",
        `Failed to create user record for: ${fullName} (${email}) - ${userError.message}`,
        "users",
        authData.user.id,
        null,
        { email, fullName, error: userError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to create user record: " + userError.message,
      );
    }

    // Log the successful admin action
    await logAdminAction(
      "CREATE",
      `Created new admin user: ${fullName} (${email})`,
      "users",
      userData.id,
      null,
      userData,
    );

    return encodedRedirect(
      "success",
      "/dashboard/admin",
      "Admin user created successfully",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    // Log the unexpected error
    await logAdminAction(
      "CREATE_ERROR",
      `Unexpected error creating admin user: ${fullName} (${email}) - ${error}`,
      "users",
      null,
      null,
      { email, fullName, error: String(error) },
    );
    return encodedRedirect(
      "error",
      "/dashboard/admin",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const updateAdminUser = async (formData: FormData) => {
  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!userId || !email || !fullName) {
    await logAdminAction(
      "UPDATE_FAILED",
      `Failed to update admin user - missing required fields`,
      "users",
      userId,
      null,
      { userId, email, fullName, error: "Required fields missing" },
    );
    return encodedRedirect(
      "error",
      "/dashboard/admin",
      "Required fields are missing",
    );
  }

  const supabase = await createClient();

  try {
    // Get current user data for logging
    const { data: currentUser, error: getCurrentError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (getCurrentError) {
      console.error("Error getting current user:", getCurrentError);
      await logAdminAction(
        "UPDATE_FAILED",
        `Failed to get user data for update: ${userId} - ${getCurrentError.message}`,
        "users",
        userId,
        null,
        { userId, error: getCurrentError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to get user data",
      );
    }

    // Update auth user if password is provided
    if (password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email,
          password,
        },
      );

      if (authError) {
        console.error("Error updating auth user:", authError);
        await logAdminAction(
          "UPDATE_FAILED",
          `Failed to update auth user: ${fullName} (${email}) - ${authError.message}`,
          "users",
          userId,
          currentUser,
          { email, fullName, error: authError.message },
        );
        return encodedRedirect(
          "error",
          "/dashboard/admin",
          "Failed to update auth user: " + authError.message,
        );
      }
    } else {
      // Update only email if no password provided
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email },
      );

      if (authError) {
        console.error("Error updating auth user email:", authError);
        await logAdminAction(
          "UPDATE_FAILED",
          `Failed to update auth user email: ${fullName} (${email}) - ${authError.message}`,
          "users",
          userId,
          currentUser,
          { email, fullName, error: authError.message },
        );
        return encodedRedirect(
          "error",
          "/dashboard/admin",
          "Failed to update auth user: " + authError.message,
        );
      }
    }

    // Update user record in users table
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        email,
        full_name: fullName,
        name: name || fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (userError) {
      console.error("Error updating user record:", userError);
      await logAdminAction(
        "UPDATE_FAILED",
        `Failed to update user record: ${fullName} (${email}) - ${userError.message}`,
        "users",
        userId,
        currentUser,
        { email, fullName, error: userError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to update user record: " + userError.message,
      );
    }

    // Log the successful admin action
    await logAdminAction(
      "UPDATE",
      `Updated admin user: ${fullName} (${email})${password ? " (password changed)" : ""}`,
      "users",
      userId,
      currentUser,
      updatedUser,
    );

    return encodedRedirect(
      "success",
      "/dashboard/admin",
      "Admin user updated successfully",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    await logAdminAction(
      "UPDATE_ERROR",
      `Unexpected error updating admin user: ${fullName} (${email}) - ${error}`,
      "users",
      userId,
      null,
      { email, fullName, error: String(error) },
    );
    return encodedRedirect(
      "error",
      "/dashboard/admin",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const deleteAdminUser = async (formData: FormData) => {
  const userId = formData.get("userId") as string;

  if (!userId) {
    await logAdminAction(
      "DELETE_FAILED",
      "Failed to delete admin user - User ID is required",
      "users",
      null,
      null,
      { error: "User ID is required" },
    );
    return encodedRedirect("error", "/dashboard/admin", "User ID is required");
  }

  const supabase = await createClient();

  try {
    // Get current user data for logging
    const { data: currentUser, error: getCurrentError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (getCurrentError) {
      console.error("Error getting current user:", getCurrentError);
      await logAdminAction(
        "DELETE_FAILED",
        `Failed to get user data for deletion: ${userId} - ${getCurrentError.message}`,
        "users",
        userId,
        null,
        { userId, error: getCurrentError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to get user data",
      );
    }

    // Check if this is the current user
    const {
      data: { user: currentAuthUser },
    } = await supabase.auth.getUser();
    if (currentAuthUser?.id === userId) {
      await logAdminAction(
        "DELETE_FAILED",
        `Attempted to delete own account: ${currentUser.full_name || currentUser.name} (${currentUser.email})`,
        "users",
        userId,
        currentUser,
        { error: "Cannot delete own account" },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Cannot delete your own account",
      );
    }

    // Delete user record from users table
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (userError) {
      console.error("Error deleting user record:", userError);
      await logAdminAction(
        "DELETE_FAILED",
        `Failed to delete user record: ${currentUser.full_name || currentUser.name} (${currentUser.email}) - ${userError.message}`,
        "users",
        userId,
        currentUser,
        { error: userError.message },
      );
      return encodedRedirect(
        "error",
        "/dashboard/admin",
        "Failed to delete user record: " + userError.message,
      );
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Log the auth deletion failure but don't fail the operation
      await logAdminAction(
        "DELETE_PARTIAL",
        `Deleted user record but failed to delete auth user: ${currentUser.full_name || currentUser.name} (${currentUser.email}) - ${authError.message}`,
        "users",
        userId,
        currentUser,
        { authError: authError.message },
      );
    }

    // Log the successful admin action
    await logAdminAction(
      "DELETE",
      `Deleted admin user: ${currentUser.full_name || currentUser.name} (${currentUser.email})${authError ? " (auth deletion failed)" : ""}`,
      "users",
      userId,
      currentUser,
      null,
    );

    return encodedRedirect(
      "success",
      "/dashboard/admin",
      "Admin user deleted successfully",
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    await logAdminAction(
      "DELETE_ERROR",
      `Unexpected error deleting admin user: ${userId} - ${error}`,
      "users",
      userId,
      null,
      { userId, error: String(error) },
    );
    return encodedRedirect(
      "error",
      "/dashboard/admin",
      "An unexpected error occurred. Please try again.",
    );
  }
};
