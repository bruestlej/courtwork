import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json(
      { error: "Only trainers can add clients" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Secure RPC — trainers can find a client by exact email without listing all clients
  const { data: matches, error: findError } = await supabase.rpc(
    "find_client_by_email",
    { lookup_email: email }
  );

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 400 });
  }

  const client = Array.isArray(matches) ? matches[0] : matches;
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Client not found. Ask them to sign up as a Client first, then add their exact email.",
      },
      { status: 404 }
    );
  }

  if (client.id === user.id) {
    return NextResponse.json(
      { error: "You cannot add yourself as a client" },
      { status: 400 }
    );
  }

  const { error: linkError } = await supabase.from("trainer_clients").insert({
    trainer_id: user.id,
    client_id: client.id,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      return NextResponse.json(
        { error: "This client is already on your roster" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  return NextResponse.json({
    client: {
      id: client.id,
      full_name: client.full_name,
      email: client.email,
    },
  });
}
