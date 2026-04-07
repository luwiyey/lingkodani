import { z } from 'zod';

function coerceBooleanInput(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'y', 'shared', 'shared_household'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'individual'].includes(normalized)) {
      return false;
    }
  }

  return value;
}

function trimStringInput(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function coerceStringArrayInput(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'string' ? item.split(/[\n,]/) : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

const optionalTimeFieldSchema = z
  .preprocess(trimStringInput, z.union([
    z.literal(''),
    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Gamitin ang 24-hour format na HH:MM."),
  ]))
  .optional()
  .transform((value) => value ?? '');

const optionalStringArraySchema = (maxItems: number) =>
  z
    .preprocess(
      coerceStringArrayInput,
      z.array(z.string().trim().min(1)).max(maxItems, {
        message: `Hanggang ${maxItems} entries lamang ang pinapayagan.`,
      }).optional()
    )
    .transform((value) => value ?? []);

export const farmerRegistrationSchema = z.object({
  name: z.string().min(1, { message: "Ang buong pangalan ay kinakailangan." }),
  phone: z.string().min(1, { message: "Ang numero ng telepono ay kinakailangan." }).regex(/^(\+63|0)9\d{9}$/, "Mangyaring maglagay ng wastong numero ng telepono sa Pilipinas (hal., +639... or 09...)."),
  barangay: z.string(), // Readonly, no validation needed
  sitio: z.string({
    required_error: "Mangyaring pumili ng zone.",
  }),
  crops: z.string().optional(),
  farmSize: z.coerce.number({ invalid_type_error: "Mangyaring maglagay ng numero." }).optional(),
  age: z.coerce.number({ invalid_type_error: "Mangyaring maglagay ng numero." }).optional(),
  gender: z.string().optional(),
  sharedPhone: z.preprocess(coerceBooleanInput, z.boolean().optional()),
  householdLabel: z.string().optional(),
  sharedPhoneNotes: z.string().optional(),
});

export type FarmerRegistrationValues = z.infer<typeof farmerRegistrationSchema>;


export const userManagementSchema = z
  .object({
    name: z.string().min(1, { message: "Ang buong pangalan ay kinakailangan." }),
    email: z.string().email({ message: "Mangyaring maglagay ng wastong email address." }),
    title: z.string().min(1, { message: "Ang tungkulin ay kinakailangan." }),
    phone: z
      .string()
      .min(1, { message: "Ang mobile number ay kinakailangan." })
      .regex(/^(\+63|0)9\d{9}$/, "Mangyaring maglagay ng wastong numero ng telepono sa Pilipinas."),
    role: z.enum(['barangay', 'developer'], {
      required_error: "Mangyaring pumili ng role.",
    }),
    status: z.enum(['active', 'pending_setup', 'disabled'], {
      required_error: "Mangyaring pumili ng status.",
    }),
    preferredWorkspace: z.enum(['simple', 'detailed'], {
      required_error: "Mangyaring pumili ng workspace.",
    }),
    assignmentRole: z.enum(['recipient', 'owner', 'resolver', 'supervisor'], {
      required_error: "Mangyaring pumili ng assignment role.",
    }),
    availabilityStatus: z.enum(['available', 'busy', 'off_shift'], {
      required_error: "Mangyaring pumili ng availability status.",
    }),
    shiftStartTime: optionalTimeFieldSchema,
    shiftEndTime: optionalTimeFieldSchema,
    assignedZones: optionalStringArraySchema(8),
    expertiseTags: optionalStringArraySchema(10),
    availabilityNote: z.preprocess(trimStringInput, z.string().max(240, {
      message: "Panatilihin sa 240 characters o mas maiksi ang availability note.",
    }).optional()).transform((value) => value ?? ''),
  })
  .superRefine((value, context) => {
    const hasShiftStart = Boolean(value.shiftStartTime);
    const hasShiftEnd = Boolean(value.shiftEndTime);

    if (hasShiftStart !== hasShiftEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasShiftStart ? 'shiftEndTime' : 'shiftStartTime'],
        message: "Kapag may shift window, ilagay ang parehong start at end time.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    availabilityStatus: value.status === 'disabled' ? 'off_shift' : value.availabilityStatus,
  }));

export type UserManagementValues = z.infer<typeof userManagementSchema>;
