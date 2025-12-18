import { z } from "zod";

// Auth validations
export const emailSchema = z
  .string()
  .trim()
  .min(1, "يرجى إدخال البريد الإلكتروني")
  .email("البريد الإلكتروني غير صالح")
  .max(255, "البريد الإلكتروني طويل جداً");

export const passwordSchema = z
  .string()
  .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
  .max(72, "كلمة المرور طويلة جداً");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "يرجى إدخال الاسم الكامل")
  .max(100, "الاسم طويل جداً");

export const membershipNumberSchema = z
  .string()
  .trim()
  .min(1, "يرجى إدخال رقم العضوية")
  .max(50, "رقم العضوية طويل جداً");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  governorate: z.string().min(1, "يرجى اختيار المحافظة"),
  membershipNumber: membershipNumberSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Task submission validation
export const taskProofSchema = z
  .string()
  .trim()
  .min(1, "يرجى إدخال إثبات إكمال المهمة")
  .max(10000, "النص طويل جداً (الحد الأقصى 10000 حرف)");

// Chat message validation
export const chatMessageSchema = z
  .string()
  .trim()
  .max(5000, "الرسالة طويلة جداً (الحد الأقصى 5000 حرف)");

// Type definitions for validation results
type ValidationSuccess<T> = { success: true; data: T };
type ValidationError = { success: false; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data } as ValidationSuccess<T>;
  }
  return { success: false, error: result.error.errors[0]?.message || "خطأ في التحقق" } as ValidationError;
}

// Simple validation that throws an error
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message || "خطأ في التحقق");
  }
  return result.data;
}
