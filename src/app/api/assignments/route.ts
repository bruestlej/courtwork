import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAssignment } from "@/lib/assignments";
import { sendHomeworkEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";
import { isProActive } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trainer } = await supabase
    .from("profiles")
    .select("role, full_name, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json(
      { error: "Only trainers can assign homework" },
      { status: 403 }
    );
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

  let emailSent = false;
  let emailError: string | null = null;

  const proActive = trainer && isProActive(trainer.subscription_status);

  if (!proActive) {
    emailError = "Email notifications are a Pro feature";
  } else if (!process.env.RESEND_API_KEY) {
    emailError = "RESEND_API_KEY is not configured";
    console.warn("[assignments] Skipping homework email:", emailError);
  } else {
    const { data: client, error: clientError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", client_id)
      .maybeSingle();

    if (clientError || !client?.email) {
      emailError = clientError?.message || "Could not load client email";
      console.error("[assignments] Homework email skipped:", emailError);
    } else {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendHomeworkEmail({
          to: client.email,
          clientName: client.full_name || "Athlete",
          trainerName: trainer.full_name || "Your trainer",
          assignmentTitle: title,
          dueDate: due_date ? formatDate(due_date) : undefined,
          homeworkUrl: `${baseUrl}/homework/${assignment.id}`,
        });
        emailSent = true;
      } catch (e) {
        emailError =
          e instanceof Error ? e.message : "Failed to send homework email";
        console.error("[assignments] Failed to send email:", emailError);
      }
    }
  }

  return NextResponse.json({
    ...assignment,
    email_sent: emailSent,
    email_error: emailError,
  });
}
