import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "UniManage — University Management Portal",
  description:
    "Unified academic operations for students, instructors, and administrators: course registration, attendance, exams, transcripts, and Stripe billing.",
  openGraph: {
    title: "UniManage — University Management Portal",
    description:
      "Registration, attendance, exams, results, transcripts, and tuition billing in one place.",
    type: "website",
  },
};

const PLATFORM_METRICS = [
  {
    label: "Role Portals",
    value: "3",
    detail: "Admin, Instructor & Student",
  },
  {
    label: "Academic Engine",
    value: "Real-Time",
    detail: "Prerequisite & clash checks",
  },
  {
    label: "Tuition Checkout",
    value: "Stripe",
    detail: "Verified webhook settlement",
  },
  {
    label: "Grading & CGPA",
    value: "Automated",
    detail: "Weighted exams to transcripts",
  },
];

const ROLE_HIGHLIGHTS = [
  {
    title: "For Students",
    description:
      "Browse open course sections, enroll with automatic prerequisite checks, track attendance percentages, view published grades, and pay tuition via Stripe.",
    icon: GraduationCap,
    href: "/login",
    cta: "Student Login",
  },
  {
    title: "For Instructors",
    description:
      "Manage assigned section rosters, record daily bulk attendance, configure weighted exams, enter marks, and compute draft semester grades.",
    icon: UserCheck,
    href: "/login",
    cta: "Instructor Login",
  },
  {
    title: "For Administrators",
    description:
      "Configure departments, degree programs, courses, and semester lifecycles, publish final results, generate invoices, and review system audit logs.",
    icon: ShieldCheck,
    href: "/login",
    cta: "Admin Console",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Hero Section */}
      <section className="glass-strong relative overflow-hidden rounded-2xl p-8 sm:p-12">
        <div className="max-w-2xl space-y-6">
          <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Unified Academic Operations
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            One place for every semester.
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Registration, attendance, exams, results, official transcripts, and
            tuition billing — engineered for students, instructors, and
            university administrators.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/login">
                Open Portal
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/programs">Explore Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section aria-label="Platform capabilities" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_METRICS.map((metric) => (
          <Card key={metric.label} className="py-5">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs font-medium">
                {metric.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                {metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Role Portals */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Built for every campus role
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try any role immediately using One-Click Demo Login on the sign-in
              page.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/tuition-faq">View Tuition &amp; FAQ</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {ROLE_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="justify-between">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-opacity hover:opacity-80"
                  >
                    {item.cta}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Links Banner */}
      <section className="glass flex flex-col items-start justify-between gap-6 rounded-2xl p-7 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-brand sm:flex">
            <BookOpenCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Ready to explore the academic portal?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with one click as an Admin, Instructor, or Student, or
              reach out to admissions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/contact">
              <CreditCard className="size-4" aria-hidden="true" />
              Admissions &amp; Contact
            </Link>
          </Button>
          <Button asChild>
            <Link href="/login">Demo Login</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
