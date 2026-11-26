"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ListOrdered,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  DayOfWeekEnum,
  sectionFormSchema,
  type Course,
  type DayOfWeek,
  type Section,
  type Semester,
  type TSectionFormInput,
  type UserSummary,
} from "@/types/api";

const DAYS = DayOfWeekEnum.options;

const STEPS = [
  { id: 1, title: "Section Info", icon: ListOrdered },
  { id: 2, title: "Instructor", icon: UserCheck },
  { id: 3, title: "Schedule Slots", icon: CalendarClock },
] as const;

export interface SectionWizardDialogProps {
  courses: Course[];
  semesters: Semester[];
  instructors: UserSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SectionWizardDialog({
  courses,
  semesters,
  instructors,
  open,
  onOpenChange,
}: SectionWizardDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const form = useForm<TSectionFormInput>({
    resolver: zodResolver(sectionFormSchema),
    mode: "onChange",
    defaultValues: {
      sectionNumber: "01",
      courseId: "",
      semesterId: "",
      instructorId: null,
      capacity: 40,
      room: "",
      schedule: [{ day: "MON", startTime: "09:00", endTime: "10:30" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    const defaultSemester =
      semesters.find((s) => s.status === "ACTIVE") ?? semesters[0];
    form.reset({
      sectionNumber: "01",
      courseId: courses[0]?.id ?? "",
      semesterId: defaultSemester?.id ?? "",
      instructorId: null,
      capacity: 40,
      room: "",
      schedule: [{ day: "MON", startTime: "09:00", endTime: "10:30" }],
    });
  }, [open, courses, semesters, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Section, ApiError, TSectionFormInput>({
    mutationFn: (values) =>
      apiFetch<Section>("/sections", {
        method: "POST",
        body: {
          sectionNumber: values.sectionNumber.trim(),
          courseId: values.courseId,
          semesterId: values.semesterId,
          instructorId: values.instructorId || null,
          capacity: values.capacity,
          room: values.room?.trim() || undefined,
          schedule: values.schedule,
        },
      }),
    onSuccess: (created) => {
      toast.success(`Section ${created.sectionNumber} scheduled successfully.`);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      toast.error(error.message || "Unable to create section.");
    },
  });

  async function handleNextStep() {
    if (step === 1) {
      const valid = await form.trigger([
        "courseId",
        "semesterId",
        "sectionNumber",
        "capacity",
        "room",
      ]);
      if (valid) setStep(2);
      return;
    }
    if (step === 2) {
      const valid = await form.trigger(["instructorId"]);
      if (valid) setStep(3);
    }
  }

  function onSubmit(values: TSectionFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const isSubmitting = mutation.isPending;
  const watchedCourseId = form.watch("courseId");
  const watchedSemesterId = form.watch("semesterId");
  const watchedInstructorId = form.watch("instructorId");
  const watchedSectionNumber = form.watch("sectionNumber");
  const watchedCapacity = form.watch("capacity");

  const selectedCourse = courses.find((c) => c.id === watchedCourseId);
  const selectedSemester = semesters.find((s) => s.id === watchedSemesterId);
  const selectedInstructor = instructors.find(
    (inst) => inst.instructorProfile?.id === watchedInstructorId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="size-5 text-primary" aria-hidden="true" />
            Section Scheduling Wizard
          </DialogTitle>
          <DialogDescription>
            Configure section details, assign faculty, and define weekly meeting slots.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((item) => {
            const Icon = item.icon;
            const isActive = step === item.id;
            const isCompleted = step > item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : isCompleted
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                      : "border-border/60 bg-secondary/20 text-muted-foreground"
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background/50 text-[11px] font-semibold">
                  {isCompleted ? <Check className="size-3" /> : item.id}
                </span>
                <Icon className="hidden size-3.5 shrink-0 sm:block" />
                <span className="truncate font-medium">{item.title}</span>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Step 1: Section Info */}
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wiz-course">Course</Label>
                  <Select
                    value={watchedCourseId}
                    onValueChange={(value) =>
                      form.setValue("courseId", value, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isSubmitting || courses.length === 0}
                  >
                    <SelectTrigger id="wiz-course" className="w-full">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} — {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.courseId ? (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.courseId.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wiz-semester">Semester</Label>
                  <Select
                    value={watchedSemesterId}
                    onValueChange={(value) =>
                      form.setValue("semesterId", value, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isSubmitting || semesters.length === 0}
                  >
                    <SelectTrigger id="wiz-semester" className="w-full">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name} ({semester.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.semesterId ? (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.semesterId.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="wiz-sec-num">Section number</Label>
                  <Input
                    id="wiz-sec-num"
                    placeholder="01"
                    aria-invalid={Boolean(form.formState.errors.sectionNumber)}
                    disabled={isSubmitting}
                    {...form.register("sectionNumber")}
                  />
                  {form.formState.errors.sectionNumber ? (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.sectionNumber.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wiz-capacity">Seat capacity</Label>
                  <Input
                    id="wiz-capacity"
                    type="number"
                    min={1}
                    max={500}
                    aria-invalid={Boolean(form.formState.errors.capacity)}
                    disabled={isSubmitting}
                    {...form.register("capacity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.capacity ? (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.capacity.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wiz-room">Room (optional)</Label>
                  <Input
                    id="wiz-room"
                    placeholder="Room 402, Bldg A"
                    disabled={isSubmitting}
                    {...form.register("room")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Step 2: Instructor Assignment */}
          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wiz-instructor">Assign instructor</Label>
                <Select
                  value={watchedInstructorId ?? "unassigned"}
                  onValueChange={(value) =>
                    form.setValue(
                      "instructorId",
                      value === "unassigned" ? null : value,
                      { shouldValidate: true }
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="wiz-instructor" className="w-full">
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      Unassigned (assign later)
                    </SelectItem>
                    {instructors.map((inst) =>
                      inst.instructorProfile ? (
                        <SelectItem
                          key={inst.instructorProfile.id}
                          value={inst.instructorProfile.id}
                        >
                          {inst.instructorProfile.employeeId} — {inst.firstName}{" "}
                          {inst.lastName}
                          {inst.instructorProfile.department
                            ? ` (${inst.instructorProfile.department.code})`
                            : ""}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/25 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Summary so far</p>
                <p className="mt-1">
                  Course:{" "}
                  <span className="text-foreground">
                    {selectedCourse
                      ? `${selectedCourse.code} — ${selectedCourse.title}`
                      : "—"}
                  </span>
                </p>
                <p>
                  Semester:{" "}
                  <span className="text-foreground">
                    {selectedSemester?.name ?? "—"}
                  </span>{" "}
                  · Section{" "}
                  <span className="text-foreground">{watchedSectionNumber}</span> ·{" "}
                  <span className="text-foreground">{watchedCapacity}</span> seats
                </p>
              </div>
            </div>
          ) : null}

          {/* Step 3: Dynamic Schedule Slots */}
          {step === 3 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly schedule slots</Label>
                  <p className="text-xs text-muted-foreground">
                    Add one or more meeting times (`startTime` must precede `endTime`).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() =>
                    append({ day: "WED", startTime: "09:00", endTime: "10:30" })
                  }
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add Slot
                </Button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const slotErrors = form.formState.errors.schedule?.[index];
                  const dayVal = form.watch(`schedule.${index}.day`);
                  return (
                    <div
                      key={field.id}
                      className="rounded-xl border border-border/70 bg-secondary/25 p-3 space-y-2"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Day</Label>
                          <Select
                            value={dayVal}
                            onValueChange={(value) =>
                              form.setValue(
                                `schedule.${index}.day`,
                                value as DayOfWeek,
                                { shouldValidate: true }
                              )
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Start time</Label>
                          <Input
                            type="time"
                            disabled={isSubmitting}
                            {...form.register(`schedule.${index}.startTime`)}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">End time</Label>
                          <Input
                            type="time"
                            disabled={isSubmitting}
                            {...form.register(`schedule.${index}.endTime`)}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 text-muted-foreground hover:text-destructive"
                          disabled={fields.length <= 1 || isSubmitting}
                          onClick={() => remove(index)}
                          aria-label={`Remove slot ${index + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>

                      {slotErrors?.endTime || slotErrors?.startTime ? (
                        <p className="text-xs text-destructive" role="alert">
                          {slotErrors.endTime?.message ??
                            slotErrors.startTime?.message}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-secondary/25 p-3 text-xs">
                <Badge variant="outline">{selectedCourse?.code ?? "Course"}</Badge>
                <Badge variant="secondary">Sec {watchedSectionNumber}</Badge>
                <span className="text-muted-foreground">
                  {selectedSemester?.name} ·{" "}
                  {selectedInstructor
                    ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}`
                    : "Unassigned"}
                </span>
              </div>
            </div>
          ) : null}

          <DialogFooter className="pt-2 flex-row justify-between sm:justify-between">
            <div>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || retryCountdown > 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Scheduling…
                    </>
                  ) : retryCountdown > 0 ? (
                    `Retry in ${retryCountdown}s`
                  ) : (
                    "Create Section"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
