
-- Users table for local authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Allow NULL for Google OAuth users
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date DATE,
  weight REAL,
  gender TEXT,
  photo_url TEXT,
  microchip_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'checkup', 'vaccination', 'grooming', 'medication', 'diet'
  title TEXT NOT NULL,
  description TEXT,
  date_scheduled DATE,
  date_completed DATE,
  veterinarian_name TEXT,
  clinic_name TEXT,
  notes TEXT,
  cost REAL,
  is_completed BOOLEAN DEFAULT 0,
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_interval_days INTEGER,
  next_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vaccinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  date_administered DATE,
  next_due_date DATE,
  veterinarian_name TEXT,
  clinic_name TEXT,
  batch_number TEXT,
  notes TEXT,
  is_core_vaccine BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diet_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  food_brand TEXT,
  food_type TEXT,
  daily_amount TEXT,
  feeding_times TEXT, -- JSON array of times
  special_instructions TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_health_records_pet_id ON health_records(pet_id);
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_next_due_date ON health_records(next_due_date);
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_user_id ON vaccinations(user_id);
CREATE INDEX idx_vaccinations_next_due_date ON vaccinations(next_due_date);
CREATE INDEX idx_diet_plans_pet_id ON diet_plans(pet_id);
CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
