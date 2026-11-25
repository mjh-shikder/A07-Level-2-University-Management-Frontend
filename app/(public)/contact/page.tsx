import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/public/contact-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admissions & Contact",
  description:
    "Contact the UniManage Admissions Office, Registrar Desk, and Student Billing Support.",
  openGraph: {
    title: "Admissions & Contact | UniManage",
    description:
      "Reach university admissions, registrar, and portal support teams.",
    type: "website",
  },
};

const CONTACT_CHANNELS = [
  {
    label: "Admissions & Registrar",
    value: "admissions@university.edu",
    detail: "Program eligibility & registration guidance",
    icon: Mail,
  },
  {
    label: "Campus Helpline",
    value: "+880 01991-234567",
    detail: "Monday – Friday, 9:00 AM – 5:00 PM",
    icon: Phone,
  },
  {
    label: "Registrar Building",
    value: "100 Academic Way, Hall A",
    detail: "Student Services & Transcript Desk",
    icon: MapPin,
  },
  {
    label: "Office Hours",
    value: "Sun – Thu · 9:00 AM – 5:00 PM",
    detail: "Closed on official university holidays",
    icon: Clock,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary"
        >
          Admissions &amp; Support
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Contact Admissions
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Have questions about degree requirements, registration deadlines, or
          tuition invoices? Reach out to our campus offices directly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:self-start">
          {CONTACT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.label}>
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-brand">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardDescription className="text-xs">
                    {channel.label}
                  </CardDescription>
                  <CardTitle className="text-base">{channel.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {channel.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
