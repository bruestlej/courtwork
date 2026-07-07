import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendHomeworkEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";

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

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      playlist_id,
      client_id,
      trainer_id: user.id,
      title,
      message,
      due_date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const [{ data: client }, { data: trainer }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", client_id).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
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
