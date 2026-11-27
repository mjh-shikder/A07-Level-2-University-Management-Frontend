import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Register",
  description: "Create a new UniManage Student or Instructor account.",
});

export default function RegisterPage() {
  return <RegisterForm />;
}
