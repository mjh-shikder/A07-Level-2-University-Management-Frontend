"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Camera,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Save,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AUTH_ME_QUERY_KEY } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { UserSummary } from "@/types/api";

const profileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type ProfileImageResponse =
  | UserSummary
  | {
      imageUrl?: string | null;
      imagePublicId?: string | null;
      profileImage?: string | null;
      avatarUrl?: string | null;
      user?: UserSummary;
    };

export interface ProfileInfoFormProps {
  initialUser: UserSummary;
}

export function ProfileInfoForm({ initialUser }: ProfileInfoFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [user, setLocalUser] = useState<UserSummary>(initialUser);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: initialUser.firstName,
      lastName: initialUser.lastName,
    },
  });

  useEffect(() => {
    setLocalUser((prev) => ({
      ...initialUser,
      imageUrl: initialUser.imageUrl ?? prev.imageUrl ?? null,
      imagePublicId: initialUser.imagePublicId ?? prev.imagePublicId ?? null,
    }));
    form.reset({
      firstName: initialUser.firstName,
      lastName: initialUser.lastName,
    });
  }, [initialUser, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const updateProfileMutation = useMutation<UserSummary, ApiError, ProfileFormValues>({
    mutationFn: (values) =>
      apiFetch<UserSummary>("/users/me", {
        method: "PATCH",
        body: values,
      }),
    onSuccess: (updated) => {
      setLocalUser(updated);
      setUser(updated);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, updated);
      form.reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      toast.success("Profile updated successfully.");
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.firstName) {
        form.setError("firstName", { message: fieldErrors.firstName });
      }
      if (fieldErrors.lastName) {
        form.setError("lastName", { message: fieldErrors.lastName });
      }
      toast.error(error.message || "Unable to update profile.");
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadImageMutation = useMutation<ProfileImageResponse, ApiError, File>(
    {
      mutationFn: (file) => {
        const formData = new FormData();
        formData.append("profileImage", file);
        return apiFetch<ProfileImageResponse>("/users/profile-image", {
          method: "PATCH",
          body: formData,
        });
      },
      onSuccess: (response) => {
        const nextImage =
          ("user" in response && response.user
            ? (response.user.imageUrl ??
              response.user.profileImage ??
              response.user.avatarUrl)
            : undefined) ??
          response.imageUrl ??
          response.profileImage ??
          response.avatarUrl ??
          null;

        const updatedUser: UserSummary =
          "user" in response && response.user
            ? response.user
            : "id" in response && response.id
              ? { ...user, ...(response as UserSummary) }
              : {
                  ...user,
                  imageUrl: nextImage,
                  imagePublicId:
                    "imagePublicId" in response
                      ? response.imagePublicId
                      : user.imagePublicId,
                };

        setLocalUser(updatedUser);
        setUser(updatedUser);
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, updatedUser);
        setPreviewUrl(null);
        toast.success("Profile picture updated successfully.");
        router.refresh();
      },
      onError: (error) => {
        setPreviewUrl(null);
        toast.error(error.message || "Unable to upload profile picture.");
      },
    }
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    uploadImageMutation.mutate(file);
  }

  function onSubmit(values: ProfileFormValues) {
    if (retryCountdown > 0) return;
    updateProfileMutation.mutate(values);
  }

  const isDirty = form.formState.isDirty;
  const isSubmitting = updateProfileMutation.isPending;
  const isUploadingImage = uploadImageMutation.isPending;
  const avatarSrc =
    previewUrl ??
    user.imageUrl ??
    user.profileImage ??
    user.avatarUrl ??
    null;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <Card className="glass rounded-2xl border-white/10">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <User className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Manage your display name and review your academic profile.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border border-border">
              {avatarSrc ? (
                <AvatarImage
                  src={avatarSrc}
                  alt={`${user.firstName} ${user.lastName}`}
                  unoptimized={Boolean(previewUrl)}
                />
              ) : (
                <AvatarFallback className="text-base font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Profile Picture
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF up to 5 MB.
              </p>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload profile picture"
              disabled={isUploadingImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                <>
                  <Camera className="size-4" aria-hidden="true" />
                  Change Photo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Read-only academic / account metadata */}
        <div className="grid gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {user.studentProfile ? (
            <>
              <div className="flex items-start gap-2.5">
                <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="text-sm font-medium text-foreground">
                    {user.studentProfile.studentId}
                  </p>
                </div>
              </div>
              {user.studentProfile.program ? (
                <div className="flex items-start gap-2.5">
                  <GraduationCap
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.studentProfile.program.code} — {user.studentProfile.program.name}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {user.instructorProfile ? (
            <>
              <div className="flex items-start gap-2.5">
                <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium text-foreground">
                    {user.instructorProfile.employeeId}
                  </p>
                </div>
              </div>
              {user.instructorProfile.department ? (
                <div className="flex items-start gap-2.5">
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.instructorProfile.department.code} —{" "}
                      {user.instructorProfile.department.name}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <Separator />

        {/* Editable personal details */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-firstName">First name</Label>
              <Input
                id="profile-firstName"
                autoComplete="given-name"
                aria-invalid={Boolean(form.formState.errors.firstName)}
                disabled={isSubmitting}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-lastName">Last name</Label>
              <Input
                id="profile-lastName"
                autoComplete="family-name"
                aria-invalid={Boolean(form.formState.errors.lastName)}
                disabled={isSubmitting}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {isDirty ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() =>
                  form.reset({
                    firstName: user.firstName,
                    lastName: user.lastName,
                  })
                }
              >
                Reset
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || retryCountdown > 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : retryCountdown > 0 ? (
                `Retry in ${retryCountdown}s`
              ) : (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
