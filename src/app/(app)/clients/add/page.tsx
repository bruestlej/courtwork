"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";

export default function AddClientPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: client, error: findError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email.toLowerCase().trim())
      .eq("role", "client")
      .single();

    if (findError || !client) {
      setError(
        "Client not found. They need to sign up as a client first."
      );
      setLoading(false);
      return;
    }

    const { error: linkError } = await supabase.from("trainer_clients").insert({
      trainer_id: user.id,
      client_id: client.id,
    });

    if (linkError) {
      if (linkError.code === "23505") {
        setError("This client is already on your roster");
      } else {
        setError(linkError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(`Added ${client.full_name || client.email}`);
    setEmail("");
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <PageHeader title="Add Client" backHref="/clients" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <Card className="mb-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-orange-800">
            Your client must create an account with the &quot;client&quot; role
            first. Then enter their email here to link them.
          </p>
        </Card>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Add Client
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
