import { z } from 'zod';

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
});

export type FarmerRegistrationValues = z.infer<typeof farmerRegistrationSchema>;


export const userManagementSchema = z.object({
  name: z.string().min(1, { message: "Ang buong pangalan ay kinakailangan." }),
  email: z.string().email({ message: "Mangyaring maglagay ng wastong email address." }),
  role: z.enum(['barangay', 'developer'], {
    required_error: "Mangyaring pumili ng role.",
  }),
});

export type UserManagementValues = z.infer<typeof userManagementSchema>;
