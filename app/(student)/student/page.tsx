import { LayoutDashboard } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutDashboard className="size-6 text-accent-brand" />
          Student Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Your CGPA, enrolled courses, and upcoming classes.
        </p>
      </div>
      {/* Commit 24 will fill this with live GPA banner and timetable */}
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground border border-white/5">
        Student dashboard widgets coming in Commit 24.
      </div>
    </div>
  );
}
