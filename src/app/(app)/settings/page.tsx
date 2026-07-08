import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import SettingsPage from "./settings-client";

export default async function Settings() {
  const profile = await getProfile();
  return (
    <Suspense fallback={null}>
      <SettingsPage profile={profile} />
    </Suspense>
  );
}
