import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { getTrainerAssignments } from "@/lib/assignments";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/feedback";
import { Plus, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AssignmentsPage() {
  const profile = await requireTrainer();
  const { assignments, error } = await getTrainerAssignments(profile.id);

  return (
    <>
      <PageHeader
        title="Homework"
        subtitle={`${assignments.length} assignments`}
        action={
          <Link href="/assignments/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Assign
            </Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {error && <ErrorBanner message={error} />}
        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a) => {
              const client = a.client;
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
          !error && (
            <EmptyState
              icon={ClipboardList}
              title="No assignments yet"
              description="Build a playlist, then assign it to a client as homework."
              actionHref="/assignments/new"
              actionLabel="Assign homework"
            />
          )
        )}
      </div>
    </>
  );
}
