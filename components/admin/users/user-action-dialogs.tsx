"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import {
  RoleEnum,
  UserStatusEnum,
  type Role,
  type UserStatus,
  type UserSummary,
} from "@/types/api";

const roleSchema = z.object({
  role: RoleEnum,
});

const statusSchema = z.object({
  status: UserStatusEnum,
});

type RoleFormValues = z.infer<typeof roleSchema>;
type StatusFormValues = z.infer<typeof statusSchema>;

export interface UserRoleDialogProps {
  user: UserSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserRoleDialog({
  user,
  open,
  onOpenChange,
}: UserRoleDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: user?.role ?? "STUDENT",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({ role: user.role });
      setPendingRole(null);
      setConfirmOpen(false);
    }
  }, [user, open, form]);

  const mutation = useMutation<UserSummary, ApiError, Role>({
    mutationFn: (role) =>
      apiFetch<UserSummary>(`/admin/users/${user?.id}/role`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: (updated) => {
      toast.success(
        `Updated ${updated.firstName} ${updated.lastName}'s role to ${updated.role}.`
      );
      setConfirmOpen(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      router.refresh();
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast.error(error.message || "Failed to update user role.");
    },
  });

  const selectedRole = form.watch("role");

  function handleFormSubmit(values: RoleFormValues) {
    if (!user || values.role === user.role) return;
    setPendingRole(values.role);
    setConfirmOpen(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!mutation.isPending}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" aria-hidden="true" />
              Update User Role
            </DialogTitle>
            <DialogDescription>
              Change the permission level assigned to this university account.
            </DialogDescription>
          </DialogHeader>

          {user ? (
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <StatusBadge status={user.role} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-role-select">New role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) =>
                    form.setValue("role", value as Role, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={mutation.isPending}
                >
                  <SelectTrigger id="user-role-select" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">STUDENT</SelectItem>
                    <SelectItem value="INSTRUCTOR">INSTRUCTOR</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
                {selectedRole === "ADMIN" && user.role !== "ADMIN" ? (
                  <p className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
                    Granting ADMIN gives full control over users, grades, and billing.
                  </p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={selectedRole === user.role || mutation.isPending}
                >
                  Continue
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm role change"
        description={
          user && pendingRole
            ? `Change ${user.firstName} ${user.lastName}'s role from ${user.role} to ${pendingRole}? This action is recorded in the audit log.`
            : undefined
        }
        confirmLabel="Update Role"
        variant={pendingRole === "ADMIN" ? "destructive" : "default"}
        isLoading={mutation.isPending}
        onConfirm={() => {
          if (pendingRole) {
            mutation.mutate(pendingRole);
          }
        }}
      />
    </>
  );
}

export interface UserStatusDialogProps {
  user: UserSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserStatusDialog({
  user,
  open,
  onOpenChange,
}: UserStatusDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: user?.status ?? "ACTIVE",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({ status: user.status });
      setPendingStatus(null);
      setConfirmOpen(false);
    }
  }, [user, open, form]);

  const mutation = useMutation<UserSummary, ApiError, UserStatus>({
    mutationFn: (status) =>
      apiFetch<UserSummary>(`/admin/users/${user?.id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (updated) => {
      toast.success(
        `Updated ${updated.firstName} ${updated.lastName}'s status to ${updated.status}.`
      );
      setConfirmOpen(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      router.refresh();
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast.error(error.message || "Failed to update user status.");
    },
  });

  const selectedStatus = form.watch("status");

  function handleFormSubmit(values: StatusFormValues) {
    if (!user || values.status === user.status) return;
    setPendingStatus(values.status);
    setConfirmOpen(true);
  }

  const isRevokingStatus =
    selectedStatus === "SUSPENDED" || selectedStatus === "INACTIVE";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!mutation.isPending}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              Update Account Status
            </DialogTitle>
            <DialogDescription>
              Activate, deactivate, or suspend this user&apos;s portal access.
            </DialogDescription>
          </DialogHeader>

          {user ? (
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-status-select">New status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    form.setValue("status", value as UserStatus, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={mutation.isPending}
                >
                  <SelectTrigger id="user-status-select" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>

                {isRevokingStatus && selectedStatus !== user.status ? (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
                    All active refresh tokens for this user will be revoked immediately.
                  </p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={isRevokingStatus ? "destructive" : "default"}
                  disabled={selectedStatus === user.status || mutation.isPending}
                >
                  Continue
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm status change"
        description={
          user && pendingStatus
            ? `Set ${user.firstName} ${user.lastName}'s account status to ${pendingStatus}?${
                pendingStatus !== "ACTIVE"
                  ? " Active sessions will be terminated immediately."
                  : ""
              }`
            : undefined
        }
        confirmLabel="Update Status"
        variant={pendingStatus !== "ACTIVE" ? "destructive" : "default"}
        isLoading={mutation.isPending}
        onConfirm={() => {
          if (pendingStatus) {
            mutation.mutate(pendingStatus);
          }
        }}
      />
    </>
  );
}
