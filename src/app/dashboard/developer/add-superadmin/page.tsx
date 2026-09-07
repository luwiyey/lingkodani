import { redirect } from "next/navigation";

export default function LegacyProvisioningRedirectPage() {
  redirect("/dashboard/developer/add-user");
}
