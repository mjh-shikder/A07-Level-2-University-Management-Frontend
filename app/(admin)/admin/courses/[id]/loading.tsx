import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCourseDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      <Skeleton className="h-64 rounded-2xl" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
