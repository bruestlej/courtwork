import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

/** Fallback role router — middleware should usually redirect first. */
export default async function HomeRedirect() {
  const profile = await getProfile();
  redirect(profile.role === "client" ? "/homework" : "/dashboard");
}
