import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function HomeRedirect() {
  const profile = await getProfile();
  redirect(profile.role === "client" ? "/homework" : "/dashboard");
}
