import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass-strong w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-border bg-secondary/50 text-brand">
          <Compass className="size-6" aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold tracking-widest text-brand uppercase">
          404 · Page Not Found
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you requested may have moved, or you might not have
          permission to view it.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
