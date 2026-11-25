import { LayoutDashboard } from "lucide-react";

export default function InstructorDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutDashboard className="size-6 text-accent-brand" />
          Instructor Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Your assigned sections and quick actions.
        </p>
      </div>
      {/* Commit 20 will fill this with live section cards */}
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground border border-white/5">
        Instructor section cards coming in Commit 20.
      </div>
    </div>
  );
}
