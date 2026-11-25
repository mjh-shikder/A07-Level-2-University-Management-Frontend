import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
      <div className="flex flex-col justify-between gap-6 lg:max-w-lg lg:py-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-85"
        >
          <span
            className="size-2.5 rounded-full bg-primary glow-brand"
            aria-hidden="true"
          />
          UniManage
        </Link>

        <div className="mt-4 space-y-4 lg:mt-24">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            One place for every semester.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Registration, attendance, exams, results, transcripts and fees for
            students, instructors and administrators.
          </p>
        </div>
      </div>

      <main className="mt-8 w-full max-w-md self-center lg:mt-0 lg:shrink-0">
        {children}
      </main>
    </div>
  );
}
