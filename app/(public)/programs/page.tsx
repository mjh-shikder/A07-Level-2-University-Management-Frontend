import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { BookOpen, GraduationCap, Lock } from "lucide-react";

import { ProgramsFilter } from "@/components/public/programs-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApiFetchEnvelope } from "@/lib/api-server";
import type { Department, Program } from "@/types/api";

export const metadata: Metadata = {
  title: "Academic Programs",
  description:
    "Browse university degree programs, required credit hours, and academic departments on UniManage.",
  openGraph: {
    title: "Academic Programs | UniManage",
    description:
      "Explore accredited degree programs and academic departments.",
    type: "website",
  },
};

function ProgramsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-18 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <Skeleton key={idx} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

async function ProgramsCatalog({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ q?: string; departmentId?: string }>;
}) {
  const { q = "", departmentId = "" } = await searchParamsPromise;
  const cookieStore = await cookies();
  const hasSession = Boolean(
    cookieStore.get("accessToken")?.value ||
      cookieStore.get("refreshToken")?.value
  );

  if (!hasSession) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to browse live degree programs"
        description="The backend program and department catalog endpoints require an authenticated session. Use Quick Demo Login to explore live programs immediately."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/login?next=/programs">Sign in with Demo Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        }
      />
    );
  }

  let programs: Program[] = [];
  let departments: Department[] = [];
  let authFailed = false;

  try {
    const [programsRes, departmentsRes] = await Promise.all([
      serverApiFetchEnvelope<Program[]>("/programs", {
        params: {
          q: q || undefined,
          departmentId: departmentId || undefined,
          limit: 50,
          sortBy: "name",
          order: "asc",
        },
        redirectOnAuthError: false,
      }),
      serverApiFetchEnvelope<Department[]>("/departments", {
        params: {
          limit: 50,
          sortBy: "name",
          order: "asc",
        },
        redirectOnAuthError: false,
      }),
    ]);

    programs = programsRes.data;
    departments = departmentsRes.data;
  } catch {
    authFailed = true;
  }

  if (authFailed) {
    return (
      <EmptyState
        icon={Lock}
        title="Unable to load live program catalog"
        description="Your session may have expired or the backend server is currently unreachable. Please sign in again to view live programs."
        action={
          <Button asChild>
            <Link href="/login?next=/programs">Go to Login</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgramsFilter
        departments={departments}
        initialQuery={q}
        initialDepartmentId={departmentId}
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No matching programs found"
          description="Try clearing your search query or selecting a different academic department."
          action={
            <Button asChild variant="outline">
              <Link href="/programs">Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="justify-between">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    {program.code}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {program.requiredCredits} credits
                  </span>
                </div>
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <CardDescription>
                  {program.department
                    ? `${program.department.name} (${program.department.code})`
                    : "Academic Department"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:opacity-80"
                >
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  Apply or view in student portal
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; departmentId?: string }>;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary"
        >
          Academics
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Academic Programs
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Browse accredited degree programs, credit requirements, and
          departments across the university.
        </p>
      </div>

      <Suspense fallback={<ProgramsSkeleton />}>
        <ProgramsCatalog searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
