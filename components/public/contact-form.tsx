"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  topic: z.enum([
    "ADMISSIONS",
    "PROGRAMS",
    "TUITION_BILLING",
    "PORTAL_SUPPORT",
  ]),
  message: z
    .string()
    .trim()
    .min(10, "Please include at least 10 characters in your inquiry")
    .max(1000, "Message cannot exceed 1000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      topic: "ADMISSIONS",
      message: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitted(true);
    toast.success(
      `Inquiry recorded for ${values.fullName}. Our admissions team will follow up at ${values.email}.`
    );
    reset();
  });

  if (submitted) {
    return (
      <div className="glass-strong flex flex-col items-center justify-center rounded-2xl p-8 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-brand">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          Inquiry received
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Thank you for reaching out to the UniManage Admissions &amp; Registrar
          office. We respond to inquiries within 1–2 business days.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-strong space-y-4 rounded-2xl p-6 sm:p-8"
      noValidate
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          Send an inquiry
        </h2>
        <p className="text-sm text-muted-foreground">
          Questions about degree programs, enrollment, or tuition billing?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-name">Full name</Label>
        <Input
          id="contact-name"
          type="text"
          placeholder="Alice Johnson"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email address</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="you@university.edu"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-topic">Inquiry topic</Label>
        <Select
          defaultValue="ADMISSIONS"
          onValueChange={(value) =>
            setValue("topic", value as ContactFormValues["topic"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="contact-topic" className="w-full">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMISSIONS">
              Admissions &amp; Enrollment
            </SelectItem>
            <SelectItem value="PROGRAMS">
              Academic Programs &amp; Credits
            </SelectItem>
            <SelectItem value="TUITION_BILLING">
              Tuition Invoices &amp; Stripe Billing
            </SelectItem>
            <SelectItem value="PORTAL_SUPPORT">
              Student / Faculty Portal Support
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          rows={4}
          placeholder="Tell us how we can help..."
          aria-invalid={Boolean(errors.message)}
          className="border-input bg-secondary/40 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 aria-invalid:border-destructive flex w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register("message")}
        />
        {errors.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <Send className="size-4" aria-hidden="true" />
        Submit inquiry
      </Button>
    </form>
  );
}
