import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSectionResultsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
