import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tuition & Academic FAQ",
  description:
    "Review semester tuition structure, official 4.00 grading scale, registration rules, and Stripe payment policies.",
  openGraph: {
    title: "Tuition & Academic FAQ | UniManage",
    description:
      "Semester fee breakdown, official grading scale, and academic policies.",
    type: "website",
  },
};

const FEE_SCHEDULE = [
  {
    item: "Undergraduate Tuition (per credit hour)",
    frequency: "Per enrolled credit",
    amount: 125,
    notes: "Billed via semester invoice",
  },
  {
    item: "Semester Registration & Portal Fee",
    frequency: "Per active semester",
    amount: 150,
    notes: "Covers enrollment & transcript services",
  },
  {
    item: "Laboratory & Computing Facilities",
    frequency: "Per active semester",
    amount: 100,
    notes: "Applies to engineering & science programs",
  },
];

const GRADING_SCALE = [
  { range: "80.00% – 100.00%", letter: "A+", points: "4.00", remarks: "Outstanding" },
  { range: "75.00% – 79.99%", letter: "A", points: "3.75", remarks: "Excellent" },
  { range: "70.00% – 74.99%", letter: "A-", points: "3.50", remarks: "Very Good" },
  { range: "65.00% – 69.99%", letter: "B+", points: "3.25", remarks: "Good" },
  { range: "60.00% – 64.99%", letter: "B", points: "3.00", remarks: "Satisfactory" },
  { range: "55.00% – 59.99%", letter: "B-", points: "2.75", remarks: "Above Average" },
  { range: "50.00% – 54.99%", letter: "C+", points: "2.50", remarks: "Average" },
  { range: "45.00% – 49.99%", letter: "C", points: "2.25", remarks: "Below Average" },
  { range: "40.00% – 44.99%", letter: "D", points: "2.00", remarks: "Pass" },
  { range: "0.00% – 39.99%", letter: "F", points: "0.00", remarks: "Fail" },
];

const FAQ_ITEMS = [
  {
    id: "registration",
    question: "How does course registration and prerequisite checking work?",
    answer:
      "Students can enroll in open sections during an ACTIVE semester's registration window. The system automatically checks section capacity, prerequisite completion, schedule time clashes, and unpaid invoice holds before confirming enrollment.",
  },
  {
    id: "drop",
    question: "When can I drop an enrolled course?",
    answer:
      "Active enrollments can be dropped before the semester's registrationEnd deadline, provided grades have not already been completed. Dropping a course atomically frees the seat in the section.",
  },
  {
    id: "grading",
    question: "When do my exam marks appear on my official transcript?",
    answer:
      "Instructors record exam marks and compute DRAFT results. Grades only become visible in your student Results and Official Transcript after an administrator publishes the section results.",
  },
  {
    id: "stripe",
    question: "How do I pay my semester tuition invoice online?",
    answer:
      "Open the Invoices & Billing section in your Student Portal and click 'Pay with Stripe' on any PENDING or OVERDUE invoice. You will be redirected to Stripe Checkout, and your invoice status updates automatically via verified webhook confirmation.",
  },
];

export default function TuitionFaqPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            Policies &amp; Billing
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tuition &amp; Academic FAQ
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Standard semester fee schedule, official 4.00 grading scale, and
            answers to common enrollment and billing questions.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">
            Open Student Billing
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {/* Semester Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Semester Fee Breakdown</CardTitle>
          <CardDescription>
            Standard academic charges invoiced per semester and payable via
            Stripe Checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Component</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Standard Rate</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEE_SCHEDULE.map((row) => (
                <TableRow key={row.item}>
                  <TableCell className="font-medium text-foreground">
                    {row.item}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.frequency}
                  </TableCell>
                  <TableCell className="font-semibold text-brand">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Official Grading Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Official Grading Scale</CardTitle>
          <CardDescription>
            Weighted exam scores are mapped automatically to letter grades and
            4.00 grade points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Percentage Range</TableHead>
                <TableHead>Letter Grade</TableHead>
                <TableHead>Grade Point</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GRADING_SCALE.map((grade) => (
                <TableRow key={grade.letter}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {grade.range}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {grade.letter}
                  </TableCell>
                  <TableCell className="font-mono text-brand">
                    {grade.points}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.remarks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* FAQ Accordion */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-brand" aria-hidden="true" />
            <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>
            Key academic rules enforced across registration, grading, and
            billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="registration">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
