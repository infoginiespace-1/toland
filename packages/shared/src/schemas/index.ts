import { z } from 'zod';

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format. Must include country code, e.g. +919876543210');

export const OtpVerificationSchema = z.object({
  phone: PhoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const AddressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: PhoneSchema,
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  is_default: z.boolean().default(false),
});

export const B2BEnquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: PhoneSchema,
  companyName: z.string().min(2, 'Company / Shop name is required'),
  gstNumber: z.string().optional(),
  estimatedQuantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional(),
});
