/**
 * Full TypeScript Types and Zod Schemas for Frontend Integration
 * University Management System API
 */

import { z } from "zod";

// ==========================================
// 1. System Enums
// ==========================================

export const RoleEnum = z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]);
export type Role = z.infer<typeof RoleEnum>;

export const UserStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const SemesterStatusEnum = z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]);
export type SemesterStatus = z.infer<typeof SemesterStatusEnum>;

export const SemesterTermEnum = z.enum(["Spring", "Summer", "Fall"]);
export type SemesterTerm = z.infer<typeof SemesterTermEnum>;

export const EnrollmentStatusEnum = z.enum(["ENROLLED", "DROPPED", "COMPLETED"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusEnum>;

export const AttendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;

export const ResultStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export type ResultStatus = z.infer<typeof ResultStatusEnum>;

export const InvoiceStatusEnum = z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const PaymentStatusEnum = z.enum(["INITIATED", "SUCCESS", "FAILED"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentMethodEnum = z.enum(["STRIPE"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const DayOfWeekEnum = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

// ==========================================
// 2. Generic API Response Envelopes
// ==========================================

export interface TPaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data: T;
	meta?: TPaginationMeta;
}

export interface ApiErrorSource {
	field?: string | number;
	message: string;
}

export interface ApiErrorResponse {
	success: false;
	message: string;
	errors: ApiErrorSource[];
	stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	meta: TPaginationMeta;
}

// ==========================================
// 3. Shared Query & Pagination Parameters
// ==========================================

export interface BaseQueryParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	order?: "asc" | "desc";
	sortOrder?: "asc" | "desc";
	q?: string;
}

// ==========================================
// 4. Data Models (API Response Shapes)
// ==========================================

export interface UserSummary {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	status: UserStatus;
	imageUrl?: string | null;
	imagePublicId?: string | null;
	profileImage?: string | null;
	avatarUrl?: string | null;
	createdAt: string;
	updatedAt: string;
	studentProfile?: {
		id: string;
		studentId: string;
		program?: {
			id: string;
			name: string;
			code: string;
		} | null;
	} | null;
	instructorProfile?: {
		id: string;
		employeeId: string;
		department?: {
			id: string;
			name: string;
			code: string;
		} | null;
	} | null;
}

export interface Department {
	id: string;
	name: string;
	code: string;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Program {
	id: string;
	name: string;
	code: string;
	departmentId: string;
	requiredCredits: number;
	createdAt: string;
	updatedAt: string;
	department?: Department;
}

export interface CoursePrerequisiteSummary {
	prerequisite: {
		id: string;
		title: string;
		code: string;
		credits: number;
	};
}

export interface Course {
	id: string;
	title: string;
	code: string;
	credits: number;
	programId: string;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
	program?: {
		id: string;
		name: string;
		code: string;
		department?: {
			id: string;
			name: string;
			code: string;
		};
	};
	prerequisites?: CoursePrerequisiteSummary[];
	prerequisiteFor?: Array<{
		course: {
			id: string;
			title: string;
			code: string;
			credits: number;
		};
	}>;
}

export interface Semester {
	id: string;
	name: string;
	year: number;
	term: SemesterTerm;
	startDate: string;
	endDate: string;
	registrationStart?: string | null;
	registrationEnd?: string | null;
	status: SemesterStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ScheduleSlot {
	day: DayOfWeek;
	startTime: string; // "09:00"
	endTime: string; // "10:30"
}

export interface Section {
	id: string;
	sectionNumber: string;
	courseId: string;
	semesterId: string;
	instructorId?: string | null;
	capacity: number;
	enrolledCount: number;
	schedule: ScheduleSlot[];
	room?: string | null;
	createdAt: string;
	updatedAt: string;
	course?: {
		id: string;
		title: string;
		code: string;
		credits: number;
	};
	semester?: {
		id: string;
		name: string;
		year: number;
		term: string;
		status: SemesterStatus;
	};
	instructor?: {
		id: string;
		employeeId: string;
		user: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
	} | null;
}

export interface Enrollment {
	id: string;
	studentId: string;
	sectionId: string;
	status: EnrollmentStatus;
	enrolledAt: string;
	droppedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	section: Section;
	student?: {
		id: string;
		studentId: string;
		user: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
	};
}

export interface AttendanceRecord {
	id: string;
	enrollmentId: string;
	sectionId: string;
	date: string; // "YYYY-MM-DD"
	status: AttendanceStatus;
	remarks?: string | null;
	createdAt: string;
	updatedAt: string;
	enrollment?: {
		student?: {
			studentId: string;
			user: {
				firstName: string;
				lastName: string;
				email: string;
			};
		};
	};
}

export interface AttendanceSummary {
	totalClasses: number;
	presentCount: number;
	absentCount: number;
	lateCount: number;
	excusedCount: number;
	attendancePercentage: number;
}

export interface Exam {
	id: string;
	sectionId: string;
	title: string;
	weightPercent: number;
	maxMarks: number;
	examDate?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ExamMark {
	id: string;
	examId: string;
	enrollmentId: string;
	obtainedMarks?: number | null;
	createdAt: string;
	updatedAt: string;
	enrollment?: {
		id: string;
		student?: {
			studentId: string;
			user: {
				firstName: string;
				lastName: string;
			};
		};
	};
}

export interface Result {
	id: string;
	enrollmentId: string;
	totalWeightedPercent: number;
	letterGrade: string;
	gradePoint: number;
	status: ResultStatus;
	publishedAt?: string | null;
	publishedBy?: string | null;
	createdAt: string;
	updatedAt: string;
	publisher?: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	} | null;
	enrollment?: {
		student?: {
			id: string;
			studentId: string;
			user: {
				id: string;
				firstName: string;
				lastName: string;
				email: string;
			};
		};
	};
}

export interface TranscriptCourseItem {
	courseId: string;
	courseCode: string;
	courseTitle: string;
	credits: number;
	totalWeightedPercent: number;
	letterGrade: string;
	gradePoint: number;
	isRetake: boolean;
	isLatestAttempt: boolean;
	enrolledAt: string;
}

export interface TranscriptSemesterItem {
	semesterId: string;
	semesterName: string;
	year: number;
	term: string;
	sgpa: number;
	semesterCreditsAttempted: number;
	semesterCreditsEarned: number;
	courses: TranscriptCourseItem[];
}

export interface StudentTranscript {
	student: {
		id: string;
		studentId: string;
		firstName: string;
		lastName: string;
		email: string;
		program: {
			id: string;
			code: string;
			name: string;
			requiredCredits: number;
		} | null;
	};
	academicSummary: {
		cgpa: number;
		totalCreditsAttempted: number;
		totalCreditsEarned: number;
		totalSemestersCompleted: number;
		creditsEarned: number;
		requiredCredits: number;
		creditsRemaining: number;
		graduationEligible: boolean;
	};
	semesters: TranscriptSemesterItem[];
}

export interface StudentGPASummary {
	studentId: string;
	studentFormattedId: string;
	studentName: string;
	cgpa: number;
	totalCreditsEarned: number;
	creditsEarned: number;
	requiredCredits: number;
	creditsRemaining: number;
	graduationEligible: boolean;
	semesters: Array<{
		semesterId: string;
		semesterName: string;
		year: number;
		term: string;
		sgpa: number;
		creditsEarned: number;
	}>;
}

export interface Payment {
	id: string;
	invoiceId: string;
	transactionId: string;
	amount: number;
	method: PaymentMethod;
	status: PaymentStatus;
	gatewayResponse?: Record<string, unknown> | null;
	createdAt: string;
}

export interface Invoice {
	id: string;
	studentId: string;
	semesterId: string;
	amount: number;
	dueDate: string;
	status: InvoiceStatus;
	needsReview: boolean;
	reviewReason?: string | null;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
	semester?: {
		id: string;
		name: string;
		year: number;
		term: string;
	};
	student?: {
		studentId: string;
		user: {
			firstName: string;
			lastName: string;
			email: string;
		};
	};
	payments?: Payment[];
}

export interface AuditLog {
	id: string;
	actorId: string;
	action: string;
	entity: string;
	entityId: string;
	before?: Record<string, unknown> | null;
	after?: Record<string, unknown> | null;
	ip?: string | null;
	createdAt: string;
	actor?: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		role: Role;
	};
}

export interface DashboardStats {
	users: {
		total: number;
		byRole: {
			ADMIN: number;
			INSTRUCTOR: number;
			STUDENT: number;
		};
		byStatus: {
			ACTIVE: number;
			INACTIVE: number;
			SUSPENDED: number;
		};
	};
	academics: {
		departmentsCount: number;
		programsCount: number;
		coursesCount: number;
		activeSemester?: {
			id: string;
			name: string;
			year: number;
			term: string;
		} | null;
	};
	enrollments: {
		totalActiveEnrollments: number;
		activeSemesterEnrollments: number;
	};
	financials: {
		totalRevenue: number;
		totalInvoiced: number;
		paidInvoicesCount: number;
		pendingInvoicesCount: number;
	};
	recentAuditLogs: AuditLog[];
}

export interface SemesterReport {
	semester: {
		id: string;
		name: string;
		year: number;
		term: string;
		status: SemesterStatus;
		startDate: string;
		endDate: string;
	};
	enrollments: {
		totalEnrollments: number;
		completedEnrollments: number;
		droppedEnrollments: number;
		activeEnrollments: number;
	};
	financials: {
		totalInvoiced: number;
		totalPaid: number;
		totalPending: number;
	};
	academics: {
		totalSections: number;
		averageSGPA: number;
		passRatePercentage: number;
		gradeDistribution: Record<string, number>;
	};
}

// ==========================================
// 5. Reusable Zod Schemas for Next.js Forms
// ==========================================

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Auth Schemas
export const registerFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.max(100, "Password cannot exceed 100 characters"),
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(100, "First name cannot exceed 100 characters"),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(100, "Last name cannot exceed 100 characters"),
});
export type TRegisterFormInput = z.infer<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z.object({
	email: z.string().email("Invalid email address"),
});
export type TForgotPasswordFormInput = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z.object({
	token: z.string().min(1, "Reset token is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.max(100, "Password cannot exceed 100 characters"),
});
export type TResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

export const adminCreateUserFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8).max(100),
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	role: RoleEnum,
	departmentId: z.string().uuid("Invalid department UUID").optional(),
	programId: z.string().uuid("Invalid program UUID").optional(),
});
export type TAdminCreateUserFormInput = z.infer<typeof adminCreateUserFormSchema>;

export const batchEnrollFormSchema = z.object({
	sectionIds: z.array(z.string().uuid("Invalid section ID format")).min(1).max(10),
});
export type TBatchEnrollFormInput = z.infer<typeof batchEnrollFormSchema>;

export const resolveInvoiceReviewFormSchema = z.object({
	resolved: z.boolean(),
	note: z.string().max(500).optional(),
});
export type TResolveInvoiceReviewFormInput = z.infer<typeof resolveInvoiceReviewFormSchema>;

export const loginFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});
export type TLoginFormInput = z.infer<typeof loginFormSchema>;

export const updateProfileFormSchema = z
	.object({
		firstName: z.string().min(1).max(100).optional(),
		lastName: z.string().min(1).max(100).optional(),
	})
	.refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
		message: "At least one field (firstName or lastName) must be provided",
	});
export type TUpdateProfileFormInput = z.infer<typeof updateProfileFormSchema>;

export const changePasswordFormSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters long")
			.max(100, "New password cannot exceed 100 characters"),
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: "New password must be different from current password",
		path: ["newPassword"],
	});
export type TChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

// Academic Structure Schemas
export const departmentFormSchema = z.object({
	name: z.string().trim().min(2, "Department name must be at least 2 characters").max(100),
	code: z.string().trim().min(2).max(20).toUpperCase(),
	description: z.string().trim().max(500).optional(),
});
export type TDepartmentFormInput = z.infer<typeof departmentFormSchema>;

export const programFormSchema = z.object({
	name: z.string().trim().min(2).max(100),
	code: z.string().trim().min(2).max(20).toUpperCase(),
	departmentId: z.string().uuid("Invalid department ID format"),
	requiredCredits: z.number().int().min(1).max(300),
});
export type TProgramFormInput = z.infer<typeof programFormSchema>;

export const courseFormSchema = z.object({
	title: z.string().trim().min(2).max(150),
	code: z.string().trim().min(2).max(20).toUpperCase(),
	credits: z.number().int().min(1).max(10),
	programId: z.string().uuid("Invalid program ID format"),
	description: z.string().trim().max(1000).optional(),
});
export type TCourseFormInput = z.infer<typeof courseFormSchema>;

export const scheduleSlotFormSchema = z
	.object({
		day: DayOfWeekEnum,
		startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
		endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
	})
	.refine((data) => data.startTime < data.endTime, {
		message: "startTime must be before endTime",
		path: ["endTime"],
	});

export const sectionFormSchema = z.object({
	sectionNumber: z.string().trim().min(1).max(20),
	courseId: z.string().uuid("Invalid course ID"),
	semesterId: z.string().uuid("Invalid semester ID"),
	instructorId: z.string().uuid("Invalid instructor ID").nullable().optional(),
	capacity: z.number().int().min(1).max(500),
	schedule: z.array(scheduleSlotFormSchema).min(1, "At least one schedule slot required"),
	room: z.string().trim().max(50).optional(),
});
export type TSectionFormInput = z.infer<typeof sectionFormSchema>;

export const semesterFormSchema = z
	.object({
		name: z.string().trim().min(2).max(100),
		year: z.number().int().min(2000).max(2100),
		term: SemesterTermEnum,
		startDate: z.string().min(1, "startDate is required"),
		endDate: z.string().min(1, "endDate is required"),
		registrationStart: z.string().optional(),
		registrationEnd: z.string().optional(),
		status: SemesterStatusEnum.optional(),
	})
	.refine((data) => new Date(data.startDate) < new Date(data.endDate), {
		message: "startDate must be before endDate",
		path: ["endDate"],
	});
export type TSemesterFormInput = z.infer<typeof semesterFormSchema>;

export const bulkMarkAttendanceFormSchema = z.object({
	date: z.string().min(1, "Date is required"),
	records: z
		.array(
			z.object({
				enrollmentId: z.string().uuid(),
				status: AttendanceStatusEnum,
				remarks: z.string().trim().max(255).optional(),
			}),
		)
		.min(1, "At least one attendance record is required"),
});
export type TBulkMarkAttendanceFormInput = z.infer<typeof bulkMarkAttendanceFormSchema>;

export const examFormSchema = z.object({
	title: z.string().trim().min(1).max(100),
	weightPercent: z.number().positive().max(100),
	maxMarks: z.number().positive().max(1000),
	examDate: z.string().optional(),
});
export type TExamFormInput = z.infer<typeof examFormSchema>;

export const bulkEnterMarksFormSchema = z.object({
	marks: z
		.array(
			z.object({
				enrollmentId: z.string().uuid(),
				obtainedMarks: z.number().min(0).max(1000),
			}),
		)
		.min(1, "At least one mark entry is required"),
});
export type TBulkEnterMarksFormInput = z.infer<typeof bulkEnterMarksFormSchema>;

export const createInvoiceFormSchema = z.object({
	studentId: z.string().min(1, "studentId is required"),
	semesterId: z.string().uuid("semesterId must be a valid UUID"),
	amount: z.number().positive("amount must be greater than 0"),
	dueDate: z.string().min(1, "dueDate is required"),
	description: z.string().optional(),
});
export type TCreateInvoiceFormInput = z.infer<typeof createInvoiceFormSchema>;
