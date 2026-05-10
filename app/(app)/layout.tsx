import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { PageTransition } from "@/components/shell/PageTransition";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const conn = await queryOne<{ org_name: string | null; instance_url: string }>(
    `SELECT org_name, instance_url FROM salesforce_connections
     WHERE user_id = $1 AND disconnected_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const orgName = conn?.org_name ?? (conn?.instance_url ? new URL(conn.instance_url).hostname : undefined);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} orgName={orgName} />
        <main className="flex-1 px-8 py-10 max-w-6xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
