import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-18 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <Skeleton key={idx} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
