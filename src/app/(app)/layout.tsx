import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Account";

  return <AppShell userName={userName}>{children}</AppShell>;
}
