-- Grooming appointments table
CREATE TABLE grooming_appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  pet_id INTEGER NOT NULL,
  service_type TEXT NOT NULL, -- bath, full_groom, nail_trim, teeth_cleaning
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g., "10:00", "10:30"
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grooming_user_id ON grooming_appointments(user_id);
CREATE INDEX idx_grooming_pet_id ON grooming_appointments(pet_id);
CREATE INDEX idx_grooming_date ON grooming_appointments(appointment_date);
