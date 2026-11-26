import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AdminCourseDetailLoading from "@/app/(admin)/admin/courses/[id]/loading";
import { CourseDetailClient } from "@/components/admin/courses/course-detail-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch } from "@/lib/api-server";
import type { Course, Program } from "@/types/api";

export const metadata: Metadata = {
  title: "Course Details",
};

async function CourseDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let course: Course;
  try {
    course = await serverApiFetch<Course>(`/courses/${id}`, {
      currentPath: `/admin/courses/${id}`,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const [programs, allCourses] = await Promise.all([
    serverApiFetch<Program[]>("/programs", {
      params: { limit: 100, sortBy: "name", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Program[]),
    serverApiFetch<Course[]>("/courses", {
      params: { limit: 100, sortBy: "code", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Course[]),
  ]);

  return (
    <CourseDetailClient
      course={course}
      programs={programs}
      allCourses={allCourses}
    />
  );
}

export default function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<AdminCourseDetailLoading />}>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}
