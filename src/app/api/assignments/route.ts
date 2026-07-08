import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAssignment } from "@/lib/assignments";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendHomeworkEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { playlist_id, client_id, title, message, due_date } = body;

  if (!playlist_id || !client_id || !title) {
    return NextResponse.json(
      { error: "Playlist, client, and title are required" },
      { status: 400 }
    );
  }

  const { data: assignment, error } = await createAssignment({
    trainerId: user.id,
    playlistId: playlist_id,
    clientId: client_id,
    title,
    message,
    dueDate: due_date,
  });

  if (error || !assignment) {
    return NextResponse.json(
      { error: error || "Failed to assign homework" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const [{ data: client }, { data: trainer }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", client_id)
      .single(),
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  if (client?.email && process.env.RESEND_API_KEY) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendHomeworkEmail({
        to: client.email,
        clientName: client.full_name || "Athlete",
        trainerName: trainer?.full_name || "Your trainer",
        assignmentTitle: title,
        dueDate: due_date ? formatDate(due_date) : undefined,
        homeworkUrl: `${baseUrl}/homework/${assignment.id}`,
      });
    } catch (e) {
      console.error("Failed to send email:", e);
    }
  }

  return NextResponse.json(assignment);
}
