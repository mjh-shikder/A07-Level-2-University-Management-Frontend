"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

/** Returns the initials from first + last name, or email fallback. */
function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

/** Returns a stable hue-based colour for a user string so avatars look distinct. */
function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue} 70% 55%)`;
}

/** Role → human-readable label */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

/** Profile page path per role */
const PROFILE_PATHS: Record<string, string> = {
  ADMIN: "/admin/profile",
  INSTRUCTOR: "/instructor/profile",
  STUDENT: "/student/profile",
};

export function UserNav() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const initials = getInitials(user.firstName, user.lastName, user.email);
  const color = avatarColor(user.email ?? user.id);
  const profilePath = PROFILE_PATHS[user.role] ?? "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarFallback
              style={{ backgroundColor: color }}
              className="text-white text-xs font-semibold"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground leading-none truncate">
              {user.email}
            </p>
            <div className="mt-1.5">
              <StatusBadge status={ROLE_LABELS[user.role] ?? user.role} />
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={profilePath} className="cursor-pointer gap-2">
            <User className="size-4 text-muted-foreground" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer gap-2"
          disabled={logoutMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            logoutMutation.mutate();
          }}
        >
          <LogOut className="size-4" />
          <span>{logoutMutation.isPending ? "Signing out…" : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
