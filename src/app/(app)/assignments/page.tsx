import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList } from "lucide-react";
import { formatDate, unwrapJoin } from "@/lib/utils";

export default async function AssignmentsPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "*, client:profiles!assignments_client_id_fkey(full_name, email)"
    )
    .eq("trainer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Homework"
        subtitle={`${assignments?.length ?? 0} assignments`}
        action={
          <Link href="/assignments/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Assign
            </Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {assignments && assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a) => {
              const client = unwrapJoin(a.client);
              return (
                <Card key={a.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm">
                        {a.title}
                      </CardTitle>
                      <CardDescription>
                        {client?.full_name || client?.email}
                        {a.due_date && ` · Due ${formatDate(a.due_date)}`}
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
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-sm text-stone-500">No assignments yet</p>
            <Link href="/assignments/new">
              <Button size="sm" className="mt-3">
                Assign homework
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
