import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UploadClient } from "./upload-client";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <UploadClient isDemo={!!user.is_demo} />;
}
