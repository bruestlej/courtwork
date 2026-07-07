import { BottomNav } from "@/components/layout/bottom-nav";
import { getProfile } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {children}
      <BottomNav role={profile.role} />
    </div>
  );
}
