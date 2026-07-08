import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getClientAssignments } from "@/lib/assignments";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function HomeworkPage() {
  const profile = await requireClient();
  const assignments = await getClientAssignments(profile.id);

  return (
    <>
      <PageHeader
        title="My Homework"
        subtitle={`Hey ${profile.full_name?.split(" ")[0] || "there"}!`}
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a) => {
              const trainer = a.trainer;
              const playlist = a.playlist;
              return (
                <Link key={a.id} href={`/homework/${a.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">
                          {a.title}
                        </CardTitle>
                        <CardDescription>
                          From {trainer?.full_name || "your trainer"}
                          {a.due_date && ` · Due ${formatDate(a.due_date)}`}
                        </CardDescription>
                        {playlist && (
                          <p className="mt-1 text-xs text-stone-400">
                            {playlist.title}
                          </p>
                        )}
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
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-sm text-stone-500">
              No homework assigned yet
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Your trainer will send you workouts here
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
