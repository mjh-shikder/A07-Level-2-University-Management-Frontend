import { Skeleton } from "@/components/ui/skeleton";

export default function SectionMarksLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
