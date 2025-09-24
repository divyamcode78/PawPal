import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreatePetSchema,
  CreateHealthRecordSchema,
  CreateVaccinationSchema,
  CreateDietPlanSchema,
  CreateUserSchema,
  SignInSchema,
  CreateGroomingAppointmentSchema,
} from "@/shared/types";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateUserId,
  validatePasswordStrength,
  type AuthUser,
  type JWTPayload,
} from "@/shared/auth";

const app = new Hono<{ Bindings: Env }>();

// Local authentication middleware
const localAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }
  
  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return c.json({ error: 'JWT secret not configured' }, 500);
  }
  
  const payload = verifyToken(token, jwtSecret);
  
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  // Get user from database
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, created_at, updated_at FROM users WHERE id = ?"
  )
    .bind(payload.userId)
    .first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Unified authentication middleware that supports both Google OAuth and local auth
const unifiedAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  // If a Bearer token is present, prefer local JWT auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return localAuthMiddleware(c, next);
  }

  // Otherwise, try Google OAuth cookie-based auth
  try {
    await authMiddleware(c, next);
  } catch (_err) {
    // As a fallback, try local auth in case a non-standard client provided a token
    try {
      await localAuthMiddleware(c, next);
    } catch (_err2) {
      return c.json({ error: 'Authentication required' }, 401);
    }
  }
};

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  // In local development over http://localhost, secure cookies are not sent by browsers.
  // Adjust cookie attributes based on the request host so the Users Service session works in dev.
  const requestHostname = new URL(c.req.url).hostname;
  const isLocalhost = requestHostname === "localhost" || requestHostname === "127.0.0.1";
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: isLocalhost ? "lax" : "none",
    secure: !isLocalhost,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Local authentication routes
app.post("/api/auth/register", zValidator("json", CreateUserSchema), async (c) => {
  const body = c.req.valid("json");
  const userData = { ...body, email: body.email.trim().toLowerCase() };
  const jwtSecret = c.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return c.json({ error: 'JWT secret not configured' }, 500);
  }
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(userData.password);
  if (!passwordValidation.isValid) {
    return c.json({ 
      error: 'Password does not meet requirements',
      details: passwordValidation.errors 
    }, 400);
  }
  
  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    "SELECT id, password_hash FROM users WHERE email = ?"
  )
    .bind(userData.email)
    .first();
  
  if (existingUser) {
    // If the user exists but doesn't have a password yet (e.g., created via Google), allow setting one
    if (!existingUser.password_hash) {
      const newPasswordHash = await hashPassword(userData.password);
      const { success } = await c.env.DB.prepare(`
        UPDATE users SET 
          password_hash = ?,
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          zip_code = COALESCE(?, zip_code),
          emergency_contact_name = COALESCE(?, emergency_contact_name),
          emergency_contact_phone = COALESCE(?, emergency_contact_phone),
          updated_at = datetime('now')
        WHERE id = ?
      `)
        .bind(
          newPasswordHash,
          userData.name || null,
          userData.phone || null,
          userData.address || null,
          userData.city || null,
          userData.state || null,
          userData.zip_code || null,
          userData.emergency_contact_name || null,
          userData.emergency_contact_phone || null,
          existingUser.id
        )
        .run();

      if (!success) {
        return c.json({ error: 'Failed to set password' }, 500);
      }

      const token = generateToken({ userId: existingUser.id, email: userData.email }, jwtSecret);
      const updatedUser = await c.env.DB.prepare(
        "SELECT id, email, name, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, created_at, updated_at FROM users WHERE id = ?"
      )
        .bind(existingUser.id)
        .first();

      return c.json({ success: true, user: updatedUser, token }, 200);
    }

    return c.json({ error: 'User with this email already exists' }, 409);
  }
  
  // Hash password
  const passwordHash = await hashPassword(userData.password);
  const userId = generateUserId();
  
  // Create user
  const { success } = await c.env.DB.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, address, city, state, 
      zip_code, emergency_contact_name, emergency_contact_phone, 
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      userId,
      userData.email,
      passwordHash,
      userData.name,
      userData.phone || null,
      userData.address || null,
      userData.city || null,
      userData.state || null,
      userData.zip_code || null,
      userData.emergency_contact_name || null,
      userData.emergency_contact_phone || null
    )
    .run();
  
  if (!success) {
    return c.json({ error: 'Failed to create user' }, 500);
  }
  
  // Generate JWT token
  const token = generateToken({ userId, email: userData.email }, jwtSecret);
  
  // Get created user (without password hash)
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, created_at, updated_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();
  
  return c.json({
    success: true,
    user,
    token
  }, 201);
});

app.post("/api/auth/login", zValidator("json", SignInSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const normalizedEmail = email.trim().toLowerCase();
  const jwtSecret = c.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return c.json({ error: 'JWT secret not configured' }, 500);
  }
  
  // Get user with password hash
  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, name, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, created_at, updated_at FROM users WHERE email = ?"
  )
    .bind(normalizedEmail)
    .first();
  
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  
  if (!isValidPassword) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // Generate JWT token
  const token = generateToken({ userId: user.id, email: user.email }, jwtSecret);
  
  // Remove password hash from response
  const { password_hash, ...userWithoutPassword } = user;
  
  return c.json({
    success: true,
    user: userWithoutPassword,
    token
  });
});

app.get("/api/auth/me", localAuthMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.post("/api/auth/logout", localAuthMiddleware, async (c) => {
  // For JWT tokens, we can't invalidate them server-side without a blacklist
  // The client should remove the token from localStorage
  return c.json({ success: true });
});

app.put("/api/auth/profile", localAuthMiddleware, zValidator("json", CreateUserSchema.omit({ password: true, email: true })), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const updateData = c.req.valid("json");
  
  const { success } = await c.env.DB.prepare(`
    UPDATE users SET 
      name = ?, phone = ?, address = ?, city = ?, state = ?, 
      zip_code = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `)
    .bind(
      updateData.name,
      updateData.phone || null,
      updateData.address || null,
      updateData.city || null,
      updateData.state || null,
      updateData.zip_code || null,
      updateData.emergency_contact_name || null,
      updateData.emergency_contact_phone || null,
      user.id
    )
    .run();
  
  if (!success) {
    return c.json({ error: 'Failed to update profile' }, 500);
  }
  
  // Get updated user
  const updatedUser = await c.env.DB.prepare(
    "SELECT id, email, name, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, created_at, updated_at FROM users WHERE id = ?"
  )
    .bind(user.id)
    .first();
  
  return c.json({
    success: true,
    user: updatedUser
  });
});

// Pet routes
app.get("/api/pets", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM pets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

app.post("/api/pets", unifiedAuthMiddleware, zValidator("json", CreatePetSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petData = c.req.valid("json");

  const { success } = await c.env.DB.prepare(`
    INSERT INTO pets (user_id, name, species, breed, birth_date, weight, gender, photo_url, microchip_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      user.id,
      petData.name,
      petData.species,
      petData.breed || null,
      petData.birth_date || null,
      petData.weight || null,
      petData.gender || null,
      petData.photo_url || null,
      petData.microchip_id || null
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create pet" }, 500);
  }

  return c.json({ success: true }, 201);
});

app.get("/api/pets/:id", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("id");

  const pet = await c.env.DB.prepare(
    "SELECT * FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  return c.json(pet);
});

// Health records routes
app.get("/api/pets/:petId/health-records", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM health_records 
    WHERE pet_id = ? AND user_id = ? 
    ORDER BY 
      CASE WHEN next_due_date IS NOT NULL THEN next_due_date ELSE date_scheduled END ASC,
      created_at DESC
  `)
    .bind(petId, user.id)
    .all();

  return c.json(results);
});

app.post("/api/pets/:petId/health-records", unifiedAuthMiddleware, zValidator("json", CreateHealthRecordSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");
  const recordData = c.req.valid("json");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO health_records (
      pet_id, user_id, record_type, title, description, date_scheduled,
      veterinarian_name, clinic_name, notes, cost, is_recurring, 
      recurrence_interval_days, next_due_date, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      petId,
      user.id,
      recordData.record_type,
      recordData.title,
      recordData.description || null,
      recordData.date_scheduled || null,
      recordData.veterinarian_name || null,
      recordData.clinic_name || null,
      recordData.notes || null,
      recordData.cost || null,
      recordData.is_recurring,
      recordData.recurrence_interval_days || null,
      recordData.date_scheduled || null
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create health record" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Vaccinations routes
app.get("/api/pets/:petId/vaccinations", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM vaccinations 
    WHERE pet_id = ? AND user_id = ? 
    ORDER BY next_due_date ASC, date_administered DESC
  `)
    .bind(petId, user.id)
    .all();

  return c.json(results);
});

app.post("/api/pets/:petId/vaccinations", unifiedAuthMiddleware, zValidator("json", CreateVaccinationSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");
  const vaccinationData = c.req.valid("json");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO vaccinations (
      pet_id, user_id, vaccine_name, date_administered, next_due_date,
      veterinarian_name, clinic_name, batch_number, notes, is_core_vaccine,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      petId,
      user.id,
      vaccinationData.vaccine_name,
      vaccinationData.date_administered || null,
      vaccinationData.next_due_date || null,
      vaccinationData.veterinarian_name || null,
      vaccinationData.clinic_name || null,
      vaccinationData.batch_number || null,
      vaccinationData.notes || null,
      vaccinationData.is_core_vaccine
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create vaccination record" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Diet plans routes
app.get("/api/pets/:petId/diet-plans", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM diet_plans 
    WHERE pet_id = ? AND user_id = ? 
    ORDER BY is_active DESC, created_at DESC
  `)
    .bind(petId, user.id)
    .all();

  return c.json(results);
});

app.post("/api/pets/:petId/diet-plans", unifiedAuthMiddleware, zValidator("json", CreateDietPlanSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const petId = c.req.param("petId");
  const dietData = c.req.valid("json");

  // Verify pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(petId, user.id)
    .first();

  if (!pet) {
    return c.json({ error: "Pet not found" }, 404);
  }

  const feedingTimesJson = dietData.feeding_times ? JSON.stringify(dietData.feeding_times) : null;

  const { success } = await c.env.DB.prepare(`
    INSERT INTO diet_plans (
      pet_id, user_id, food_brand, food_type, daily_amount, feeding_times,
      special_instructions, start_date, end_date, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      petId,
      user.id,
      dietData.food_brand || null,
      dietData.food_type || null,
      dietData.daily_amount || null,
      feedingTimesJson,
      dietData.special_instructions || null,
      dietData.start_date || null,
      dietData.end_date || null
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create diet plan" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Dashboard overview
app.get("/api/dashboard", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Get upcoming due items across all pets
  const { results: upcomingItems } = await c.env.DB.prepare(`
    SELECT 
      hr.id,
      hr.title,
      hr.record_type,
      hr.next_due_date as due_date,
      p.name as pet_name,
      p.id as pet_id
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE hr.user_id = ? 
      AND p.is_active = 1 
      AND hr.is_completed = 0
      AND hr.next_due_date IS NOT NULL
      AND date(hr.next_due_date) <= date('now', '+30 days')
    
    UNION ALL
    
    SELECT 
      v.id,
      v.vaccine_name as title,
      'vaccination' as record_type,
      v.next_due_date as due_date,
      p.name as pet_name,
      p.id as pet_id
    FROM vaccinations v
    JOIN pets p ON v.pet_id = p.id
    WHERE v.user_id = ? 
      AND p.is_active = 1 
      AND v.next_due_date IS NOT NULL
      AND date(v.next_due_date) <= date('now', '+30 days')
    
    ORDER BY due_date ASC
    LIMIT 10
  `)
    .bind(user.id, user.id)
    .all();

  // Get pet count
  const petCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM pets WHERE user_id = ? AND is_active = 1"
  )
    .bind(user.id)
    .first();

  return c.json({
    upcomingItems,
    petCount: petCount?.count || 0,
  });
});

// Grooming appointments
app.get("/api/groomings", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM grooming_appointments WHERE user_id = ? ORDER BY appointment_date DESC, time_slot DESC`
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

// Define availability before dynamic :id route to avoid shadowing
// Public endpoint: availability doesn't require authentication
app.get("/api/groomings/availability", async (c) => {
  const url = new URL(c.req.url);
  const date = url.searchParams.get("date");
  if (!date) return c.json({ error: "date is required (YYYY-MM-DD)" }, 400);

  // Define working hours and 30-minute slots
  const startHour = 9; // 09:00
  const endHour = 17; // last slot starts 16:30
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }

  // Fetch taken slots for that date (any user)
  const { results: taken } = await c.env.DB.prepare(
    `SELECT time_slot FROM grooming_appointments WHERE appointment_date = ? AND status IN ('pending','confirmed')`
  )
    .bind(date)
    .all();

  const takenSet = new Set((taken || []).map((r: any) => r.time_slot));
  const availability = slots.map((s) => ({ time_slot: s, available: !takenSet.has(s) }));
  return c.json({ date, availability });
});

app.get("/api/groomings/:id", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");

  const appt = await c.env.DB.prepare(
    `SELECT * FROM grooming_appointments WHERE id = ? AND user_id = ?`
  )
    .bind(id, user.id)
    .first();

  if (!appt) return c.json({ error: "Not found" }, 404);
  return c.json(appt);
});

// (availability route defined above)

app.post("/api/groomings", unifiedAuthMiddleware, zValidator("json", CreateGroomingAppointmentSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = c.req.valid("json");

  // Validate pet ownership
  const pet = await c.env.DB.prepare(
    "SELECT id FROM pets WHERE id = ? AND user_id = ? AND is_active = 1"
  )
    .bind(body.pet_id, user.id)
    .first();
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  // Prevent double booking for same slot
  const conflict = await c.env.DB.prepare(
    `SELECT id FROM grooming_appointments WHERE appointment_date = ? AND time_slot = ? AND status IN ('pending','confirmed')`
  )
    .bind(body.appointment_date, body.time_slot)
    .first();
  if (conflict) return c.json({ error: "Selected time slot is not available" }, 409);

  const { success } = await c.env.DB.prepare(
    `INSERT INTO grooming_appointments (user_id, pet_id, service_type, appointment_date, time_slot, price, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, datetime('now'), datetime('now'))`
  )
    .bind(
      user.id,
      body.pet_id,
      body.service_type,
      body.appointment_date,
      body.time_slot,
      body.price,
      body.notes || null,
    )
    .run();

  if (!success) return c.json({ error: "Failed to create appointment" }, 500);

  // Return created record
  const created = await c.env.DB.prepare(
    `SELECT * FROM grooming_appointments WHERE user_id = ? AND pet_id = ? AND appointment_date = ? AND time_slot = ? ORDER BY id DESC LIMIT 1`
  )
    .bind(user.id, body.pet_id, body.appointment_date, body.time_slot)
    .first();

  return c.json(created, 201);
});

app.patch("/api/groomings/:id/cancel", unifiedAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");

  const appt = await c.env.DB.prepare(
    `SELECT id, status FROM grooming_appointments WHERE id = ? AND user_id = ?`
  )
    .bind(id, user.id)
    .first();
  if (!appt) return c.json({ error: "Not found" }, 404);
  if (appt.status === 'cancelled' || appt.status === 'completed') {
    return c.json({ error: "Cannot cancel this appointment" }, 400);
  }

  const { success } = await c.env.DB.prepare(
    `UPDATE grooming_appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND user_id = ?`
  )
    .bind(id, user.id)
    .run();
  if (!success) return c.json({ error: "Failed to cancel" }, 500);

  const updated = await c.env.DB.prepare(
    `SELECT * FROM grooming_appointments WHERE id = ? AND user_id = ?`
  )
    .bind(id, user.id)
    .first();
  return c.json(updated);
});

export default app;
