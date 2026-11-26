"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  DayOfWeekEnum,
  scheduleSlotFormSchema,
  type DayOfWeek,
  type Section,
  type UserSummary,
} from "@/types/api";

const DAYS = DayOfWeekEnum.options;

const editSectionSchema = z.object({
  sectionNumber: z.string().trim().min(1).max(20),
  capacity: z.number().int().min(1).max(500),
  room: z.string().trim().max(50).optional(),
  schedule: z.array(scheduleSlotFormSchema).min(1, "At least one slot required"),
});

type EditSectionValues = z.infer<typeof editSectionSchema>;

export interface EditSectionDialogProps {
  section: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSectionDialog({
  section,
  open,
  onOpenChange,
}: EditSectionDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<EditSectionValues>({
    resolver: zodResolver(editSectionSchema),
    mode: "onChange",
    defaultValues: {
      sectionNumber: "",
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
    if (!section || !open) return;
    form.reset({
      sectionNumber: section.sectionNumber,
      capacity: section.capacity,
      room: section.room ?? "",
      schedule:
        section.schedule.length > 0
          ? section.schedule
          : [{ day: "MON", startTime: "09:00", endTime: "10:30" }],
    });
  }, [section, open, form]);

  const mutation = useMutation<Section, ApiError, EditSectionValues>({
    mutationFn: (values) =>
      apiFetch<Section>(`/sections/${section?.id}`, {
        method: "PATCH",
        body: {
          sectionNumber: values.sectionNumber.trim(),
          capacity: values.capacity,
          room: values.room?.trim() || undefined,
          schedule: values.schedule,
        },
      }),
    onSuccess: (updated) => {
      toast.success(`Section ${updated.sectionNumber} updated.`);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to update section.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" aria-hidden="true" />
            Edit Section {section?.sectionNumber}
          </DialogTitle>
          <DialogDescription>
            Update capacity (must be ≥ {section?.enrolledCount ?? 0} enrolled), room, or schedule.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="edit-sec-num">Section number</Label>
              <Input
                id="edit-sec-num"
                disabled={mutation.isPending}
                {...form.register("sectionNumber")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sec-cap">Capacity</Label>
              <Input
                id="edit-sec-cap"
                type="number"
                min={section?.enrolledCount || 1}
                max={500}
                disabled={mutation.isPending}
                {...form.register("capacity", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sec-room">Room</Label>
              <Input
                id="edit-sec-room"
                disabled={mutation.isPending}
                {...form.register("room")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schedule slots</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ day: "WED", startTime: "09:00", endTime: "10:30" })
                }
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add Slot
              </Button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-border/70 bg-secondary/25 p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"
                >
                  <Select
                    value={form.watch(`schedule.${index}.day`)}
                    onValueChange={(value) =>
                      form.setValue(
                        `schedule.${index}.day`,
                        value as DayOfWeek,
                        { shouldValidate: true }
                      )
                    }
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
                  <Input
                    type="time"
                    {...form.register(`schedule.${index}.startTime`)}
                  />
                  <Input
                    type="time"
                    {...form.register(`schedule.${index}.endTime`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface AssignInstructorDialogProps {
  section: Section | null;
  instructors: UserSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignInstructorDialog({
  section,
  instructors,
  open,
  onOpenChange,
}: AssignInstructorDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("unassigned");

  useEffect(() => {
    if (section && open) {
      setSelectedId(section.instructorId ?? "unassigned");
    }
  }, [section, open]);

  const mutation = useMutation<Section, ApiError, string | null>({
    mutationFn: (instructorId) =>
      apiFetch<Section>(`/sections/${section?.id}/instructor`, {
        method: "PATCH",
        body: { instructorId },
      }),
    onSuccess: () => {
      toast.success("Section instructor updated.");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to assign instructor.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" aria-hidden="true" />
            Assign Instructor
          </DialogTitle>
          <DialogDescription>
            Assign or unassign faculty for {section?.course?.code} Section{" "}
            {section?.sectionNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="assign-inst-select">Instructor</Label>
          <Select
            value={selectedId}
            onValueChange={setSelectedId}
            disabled={mutation.isPending}
          >
            <SelectTrigger id="assign-inst-select" className="w-full">
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {instructors.map((inst) =>
                inst.instructorProfile ? (
                  <SelectItem
                    key={inst.instructorProfile.id}
                    value={inst.instructorProfile.id}
                  >
                    {inst.instructorProfile.employeeId} — {inst.firstName}{" "}
                    {inst.lastName}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
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
            type="button"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(selectedId === "unassigned" ? null : selectedId)
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
