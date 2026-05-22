import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PartnerShell from "@/components/PartnerShell";
import {
  PARTNER_SESSION_COOKIE,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = verifyPartnerSessionToken(token);

  if (!producer) {
    redirect("/");
  }

  return <PartnerShell producer={producer}>{children}</PartnerShell>;
}
