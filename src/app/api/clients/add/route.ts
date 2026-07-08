import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

  const admin = getSupabaseAdmin();

  // Read caller's profile with service role (avoids RLS quirks in route handlers)
  let { data: trainer } = await admin
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  // Fallback: create/sync profile from auth metadata if missing
  if (!trainer) {
    const role =
      user.user_metadata?.role === "client" ? "client" : "trainer";
    const { data: ensured } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? "",
          role,
        },
        { onConflict: "id" }
      )
      .select("id, role, email")
      .single();
    trainer = ensured;
  }

  const authRole =
    user.user_metadata?.role === "client" ? "client" : "trainer";
  const effectiveRole = trainer?.role || authRole;

  if (effectiveRole !== "trainer") {
    return NextResponse.json(
      {
        error: `Only trainers can add clients (your account role is "${effectiveRole}"). Check profiles.role in Supabase for your trainer email.`,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: matches, error: findError } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .ilike("email", email)
    .eq("role", "client")
    .limit(1);

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 400 });
  }

  const client = matches?.[0];
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Client not found. They need to sign up as a client first. Confirm role is 'client' in profiles.",
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

  // Insert with admin so link succeeds even if trainer_clients RLS is misconfigured
  const { error: linkError } = await admin.from("trainer_clients").insert({
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
