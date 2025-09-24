import z from "zod";

// User types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Pet types
export const PetSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  birth_date: z.string().nullable(),
  weight: z.number().nullable(),
  gender: z.string().nullable(),
  photo_url: z.string().nullable(),
  microchip_id: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreatePetSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  weight: z.number().positive().optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  photo_url: z.string().url().optional(),
  microchip_id: z.string().optional(),
});

// Health record types
export const HealthRecordSchema = z.object({
  id: z.number(),
  pet_id: z.number(),
  user_id: z.string(),
  record_type: z.enum(["checkup", "vaccination", "grooming", "medication", "diet"]),
  title: z.string(),
  description: z.string().nullable(),
  date_scheduled: z.string().nullable(),
  date_completed: z.string().nullable(),
  veterinarian_name: z.string().nullable(),
  clinic_name: z.string().nullable(),
  notes: z.string().nullable(),
  cost: z.number().nullable(),
  is_completed: z.boolean(),
  is_recurring: z.boolean(),
  recurrence_interval_days: z.number().nullable(),
  next_due_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateHealthRecordSchema = z.object({
  pet_id: z.number(),
  record_type: z.enum(["checkup", "vaccination", "grooming", "medication", "diet"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date_scheduled: z.string().optional(),
  veterinarian_name: z.string().optional(),
  clinic_name: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().positive().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_interval_days: z.number().positive().optional(),
});

// Vaccination types
export const VaccinationSchema = z.object({
  id: z.number(),
  pet_id: z.number(),
  user_id: z.string(),
  vaccine_name: z.string(),
  date_administered: z.string().nullable(),
  next_due_date: z.string().nullable(),
  veterinarian_name: z.string().nullable(),
  clinic_name: z.string().nullable(),
  batch_number: z.string().nullable(),
  notes: z.string().nullable(),
  is_core_vaccine: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateVaccinationSchema = z.object({
  pet_id: z.number(),
  vaccine_name: z.string().min(1, "Vaccine name is required"),
  date_administered: z.string().optional(),
  next_due_date: z.string().optional(),
  veterinarian_name: z.string().optional(),
  clinic_name: z.string().optional(),
  batch_number: z.string().optional(),
  notes: z.string().optional(),
  is_core_vaccine: z.boolean().default(false),
});

// Diet plan types
export const DietPlanSchema = z.object({
  id: z.number(),
  pet_id: z.number(),
  user_id: z.string(),
  food_brand: z.string().nullable(),
  food_type: z.string().nullable(),
  daily_amount: z.string().nullable(),
  feeding_times: z.string().nullable(),
  special_instructions: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateDietPlanSchema = z.object({
  pet_id: z.number(),
  food_brand: z.string().optional(),
  food_type: z.string().optional(),
  daily_amount: z.string().optional(),
  feeding_times: z.array(z.string()).optional(),
  special_instructions: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// Infer types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type Pet = z.infer<typeof PetSchema>;
export type CreatePet = z.infer<typeof CreatePetSchema>;
export type HealthRecord = z.infer<typeof HealthRecordSchema>;
export type CreateHealthRecord = z.infer<typeof CreateHealthRecordSchema>;
export type Vaccination = z.infer<typeof VaccinationSchema>;
export type CreateVaccination = z.infer<typeof CreateVaccinationSchema>;
export type DietPlan = z.infer<typeof DietPlanSchema>;
export type CreateDietPlan = z.infer<typeof CreateDietPlanSchema>;

// Grooming appointment types
export const GroomingAppointmentSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  pet_id: z.number(),
  service_type: z.enum(["bath", "full_groom", "nail_trim", "teeth_cleaning"]),
  appointment_date: z.string(),
  time_slot: z.string(),
  price: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateGroomingAppointmentSchema = z.object({
  pet_id: z.number(),
  service_type: z.enum(["bath", "full_groom", "nail_trim", "teeth_cleaning"]),
  appointment_date: z.string().min(1, "Date is required"),
  time_slot: z.string().min(1, "Time slot is required"),
  price: z.number().positive(),
  notes: z.string().optional(),
});

export type GroomingAppointment = z.infer<typeof GroomingAppointmentSchema>;
export type CreateGroomingAppointment = z.infer<typeof CreateGroomingAppointmentSchema>;

// Doctor appointment types
export const DoctorAppointmentSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  pet_id: z.number(),
  visit_type: z.enum(["checkup", "consultation", "emergency", "follow_up"]),
  appointment_date: z.string(),
  time_slot: z.string(),
  price: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  veterinarian_name: z.string().nullable(),
  clinic_name: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateDoctorAppointmentSchema = z.object({
  pet_id: z.number(),
  visit_type: z.enum(["checkup", "consultation", "emergency", "follow_up"]),
  appointment_date: z.string().min(1, "Date is required"),
  time_slot: z.string().min(1, "Time slot is required"),
  price: z.number().positive(),
  veterinarian_name: z.string().optional(),
  clinic_name: z.string().optional(),
  notes: z.string().optional(),
});

export type DoctorAppointment = z.infer<typeof DoctorAppointmentSchema>;
export type CreateDoctorAppointment = z.infer<typeof CreateDoctorAppointmentSchema>;
