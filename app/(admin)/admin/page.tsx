import { LayoutDashboard } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutDashboard className="size-6 text-accent-brand" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s a summary of your university system.
        </p>
      </div>
      {/* Commit 15 will fill this with live StatCards and charts */}
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground border border-white/5">
        Dashboard metrics coming in Commit 15.
      </div>
    </div>
  );
}
