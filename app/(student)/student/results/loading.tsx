import { Skeleton } from "@/components/ui/skeleton";

export default function StudentResultsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
