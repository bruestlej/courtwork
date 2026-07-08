import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countTrainerClients } from "@/lib/clients";
import { getTrainerAssignments } from "@/lib/assignments";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, ListMusic, Users, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const [clips, playlists, clientCount, assignmentResult] = await Promise.all([
    supabase
      .from("clips")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", profile.id),
    supabase
      .from("playlists")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", profile.id),
    countTrainerClients(profile.id),
    getTrainerAssignments(profile.id, 5),
  ]);

  const assignments = assignmentResult.assignments;

  const stats = [
    { label: "Clips", count: clips.count ?? 0, href: "/clips", icon: Video },
    { label: "Playlists", count: playlists.count ?? 0, href: "/playlists", icon: ListMusic },
    { label: "Clients", count: clientCount, href: "/clients", icon: Users },
  ];

  return (
    <>
      <PageHeader
        title={`Hey, ${profile.full_name?.split(" ")[0] || "Coach"}!`}
        subtitle="Your training dashboard"
      />
      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, count, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <Card className="text-center transition-shadow hover:shadow-md">
                <Icon className="mx-auto h-5 w-5 text-orange-600" />
                <p className="mt-1 text-2xl font-bold">{count}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          <Link href="/clips/new" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4" /> Upload Clip
            </Button>
          </Link>
          <Link href="/playlists/new" className="flex-1">
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4" /> New Playlist
            </Button>
          </Link>
        </div>

        <Link href="/settings">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="text-sm font-medium text-stone-700">Account & Billing</span>
            <span className="text-xs text-stone-400">Settings →</span>
          </Card>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Recent Homework</h2>
            <Link href="/assignments" className="text-xs font-medium text-orange-600">
              View all
            </Link>
          </div>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{a.title}</CardTitle>
                    <CardDescription>
                      {a.client?.full_name || a.client?.email || "Client"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      a.status === "completed"
                        ? "green"
                        : a.status === "in_progress"
                          ? "blue"
                          : "orange"
                    }
                  >
                    {a.status.replace("_", " ")}
                  </Badge>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <ClipboardList className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-2 text-sm text-stone-500">No homework assigned yet</p>
              <Link href="/playlists">
                <Button variant="ghost" size="sm" className="mt-2">
                  Create a playlist first
                </Button>
              </Link>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
