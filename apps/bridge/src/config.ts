import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080').transform((v) => parseInt(v, 10)),
  WHATSAPP_BRIDGE_SECRET: z.string().default('toland_bridge_secret_dev'),
  DATABASE_URL: z.string().default('postgresql://postgres.zgmsfnedrgthinykkgxk:TolandStaging2026!Db#Sec9@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require'),
  WHATSAPP_SESSION_ID: z.string().default('default'),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_API_PHONE_NUMBER_ID: z.string().optional(),
});

export const config = envSchema.parse(process.env);
