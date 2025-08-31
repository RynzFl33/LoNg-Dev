import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { Tables } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const { action, description, tableName, recordId, oldData, newData } =
      await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        null,
      user_agent: request.headers.get("user-agent") || null,
    };

    const { error } = await supabase.from("admin_logs").insert(logEntry);

    if (error) {
      console.error("Error logging admin action:", error);
      return NextResponse.json(
        { error: "Failed to log action" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error logging admin action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
