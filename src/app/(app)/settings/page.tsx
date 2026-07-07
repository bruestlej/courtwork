import { getProfile } from "@/lib/auth";
import SettingsPage from "./settings-client";

export default async function Settings() {
  const profile = await getProfile();
  return <SettingsPage profile={profile} />;
}
