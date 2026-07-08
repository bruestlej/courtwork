import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { getTrainerClientLinks } from "@/lib/clients";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage() {
  const profile = await requireTrainer();
  const links = await getTrainerClientLinks(profile.id);

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${links.length} athletes`}
        action={
          <Link href="/clients/add">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link) => {
              const client = link.client;
              return (
                <Card key={link.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-bold text-stone-600">
                    {(client?.full_name || client?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-sm">
                      {client?.full_name || "Unnamed"}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {client?.email}
                    </CardDescription>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-sm text-stone-500">No clients yet</p>
            <Link href="/clients/add">
              <Button size="sm" className="mt-3">
                Add your first client
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
