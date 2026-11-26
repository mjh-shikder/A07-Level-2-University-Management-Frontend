import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInvoicesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
