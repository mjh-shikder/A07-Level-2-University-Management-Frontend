import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create a new UniManage Student or Instructor account.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
