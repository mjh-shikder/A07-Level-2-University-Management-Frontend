import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Shield,
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
  title: "About",
  description:
    "Learn about UniManage academic governance, accreditation standards, institutional vision, and unified digital campus architecture.",
  openGraph: {
    title: "About | UniManage",
    description:
      "Academic governance, accreditation standards, and digital campus infrastructure.",
    type: "website",
  },
};

const PILLARS = [
  {
    title: "Curriculum Integrity",
    description:
      "Every department, degree program, and course prerequisite graph is validated against cycle-free dependency rules before registration opens.",
    icon: BookOpen,
  },
  {
    title: "Transparent Evaluation",
    description:
      "Weighted exam assessments, draft grade computation, and administrative publishing locks ensure fair, verifiable academic records.",
    icon: Award,
  },
  {
    title: "Auditable Governance",
    description:
      "Role-scoped access control and immutable audit trails protect student transcripts, grade publications, and tuition settlement.",
    icon: Shield,
  },
];

const STANDARDS = [
  "4.00 cumulative GPA & semester SGPA calculation engine",
  "Automated prerequisite and schedule time-clash verification",
  "Strict semester lifecycle states (UPCOMING, ACTIVE, COMPLETED)",
  "Webhook-verified Stripe tuition invoicing and receipt tracking",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Header */}
      <section className="glass-strong rounded-2xl p-8 sm:p-12">
        <div className="max-w-3xl space-y-5">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/10 text-primary"
          >
            <Building2 className="size-3.5" aria-hidden="true" />
            Institutional Overview
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Built for academic rigor and clarity.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            UniManage brings together curriculum planning, live course
            registration, attendance tracking, weighted grading, official
            transcripts, and tuition billing in a single, auditable university
            platform.
          </p>
        </div>
      </section>

      {/* Core Governance Pillars */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Vision &amp; Governance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Designed around how modern universities operate across every
            semester.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title}>
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Accreditation & Standards */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Accreditation &amp; Academic Standards
            </CardTitle>
            <CardDescription>
              Consistent policies enforced automatically across every department
              and semester.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STANDARDS.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span className="text-foreground/90">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="justify-between">
          <CardHeader>
            <CardTitle className="text-xl">Campus &amp; Portal Access</CardTitle>
            <CardDescription className="leading-relaxed">
              Students, instructors, and academic administrators each work from
              a dedicated workspace with role-appropriate tools and real-time
              synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/programs">
                Explore Programs
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact Admissions</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
