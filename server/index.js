import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'pawpal';
const JWT_SECRET = process.env.JWT_SECRET || '';
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

if (!MONGO_URI) {
  console.warn('MONGO_URI is not set. Server will fail to connect without it.');
}
if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Tokens will be insecure.');
}

const client = new MongoClient(MONGO_URI, { connectTimeoutMS: 10000 });

// ============ Utility Functions ============
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('Password must contain at least one special character');
  return { isValid: errors.length === 0, errors };
}

function getUserId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'default-secret', { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || 'default-secret');
  } catch (error) {
    return null;
  }
}

const now = () => new Date().toISOString();

// ============ Authentication Middleware ============
const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing token' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ error: 'invalid token' });
  }

  req.userId = payload.userId;
  next();
};

async function start() {
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    const users = db.collection('users');
    const pets = db.collection('pets');
    const healthRecords = db.collection('health_records');
    const vaccinations = db.collection('vaccinations');
    const dietPlans = db.collection('diet_plans');
    const doctorAppointments = db.collection('doctor_appointments');
    const groomingBookings = db.collection('grooming_bookings');

    const app = express();
    app.use(express.json());

    // ============ Health Check ============
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // ============ Auth Endpoints ============
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'email and password are required' });
        }
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: 'invalid email' });
        }

        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.isValid) {
          return res.status(400).json({ error: passwordCheck.errors.join('; ') });
        }

        const existing = await users.findOne({ email });
        if (existing) {
          return res.status(409).json({ error: 'user already exists' });
        }

        const id = getUserId();
        const password_hash = await bcrypt.hash(password, 12);
        const timestamp = now();

        await users.insertOne({
          id,
          email,
          name: name || '',
          password_hash,
          created_at: timestamp,
          updated_at: timestamp,
        });

        const token = createToken({ userId: id, email });
        return res.status(201).json({
          user: { id, email, name: name || '', created_at: timestamp, updated_at: timestamp },
          token,
        });
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'email and password are required' });
        }

        const user = await users.findOne({ email });
        if (!user) {
          return res.status(401).json({ error: 'invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash || '');
        if (!valid) {
          return res.status(401).json({ error: 'invalid credentials' });
        }

        const token = createToken({ userId: user.id, email: user.email });
        return res.json({ user: { id: user.id, email: user.email, name: user.name || '' }, token });
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/auth/me', authRequired, async (req, res) => {
      try {
        const user = await users.findOne({ id: req.userId }, { projection: { password_hash: 0 } });
        if (!user) {
          return res.status(404).json({ error: 'user not found' });
        }
        return res.json(user);
      } catch (error) {
        console.error('Me error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/users/me', authRequired, async (req, res) => {
      try {
        const user = await users.findOne({ id: req.userId }, { projection: { password_hash: 0 } });
        if (!user) {
          return res.status(404).json({ error: 'user not found' });
        }
        return res.json(user);
      } catch (error) {
        console.error('Users/me error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/auth/logout', (_req, res) => {
      return res.status(204).send();
    });

    app.put('/api/auth/profile', authRequired, async (req, res) => {
      try {
        const updateData = { ...req.body, updated_at: now() };
        delete updateData.id;
        delete updateData.password_hash;

        const result = await users.findOneAndUpdate(
          { id: req.userId },
          { $set: updateData },
          { returnDocument: 'after', projection: { password_hash: 0 } }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'user not found' });
        }

        return res.json({ user: result.value });
      } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Pet Endpoints ============
    app.post('/api/pets', authRequired, async (req, res) => {
      try {
        const { name, breed, age, weight } = req.body;
        if (!name || !breed) {
          return res.status(400).json({ error: 'name and breed are required' });
        }

        const id = getUserId();
        const timestamp = now();
        const pet = { id, userId: req.userId, name, breed, age, weight, created_at: timestamp, updated_at: timestamp };

        await pets.insertOne(pet);
        return res.status(201).json(pet);
      } catch (error) {
        console.error('Create pet error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/pets', authRequired, async (req, res) => {
      try {
        const userPets = await pets.find({ userId: req.userId }).toArray();
        return res.json(userPets);
      } catch (error) {
        console.error('Get pets error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/pets/:petId', authRequired, async (req, res) => {
      try {
        const pet = await pets.findOne({ id: req.params.petId, userId: req.userId });
        if (!pet) {
          return res.status(404).json({ error: 'pet not found' });
        }
        return res.json(pet);
      } catch (error) {
        console.error('Get pet error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Health Records Endpoints ============
    app.post('/api/pets/:petId/health-records', authRequired, async (req, res) => {
      try {
        const pet = await pets.findOne({ id: req.params.petId, userId: req.userId });
        if (!pet) {
          return res.status(404).json({ error: 'pet not found' });
        }

        const { title, description, date } = req.body;
        const id = getUserId();
        const timestamp = now();
        const record = { id, petId: req.params.petId, userId: req.userId, title, description, date, created_at: timestamp };

        await healthRecords.insertOne(record);
        return res.status(201).json(record);
      } catch (error) {
        console.error('Create health record error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/pets/:petId/health-records', authRequired, async (req, res) => {
      try {
        const records = await healthRecords.find({ petId: req.params.petId, userId: req.userId }).toArray();
        return res.json(records);
      } catch (error) {
        console.error('Get health records error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Vaccinations Endpoints ============
    app.get('/api/pets/:petId/vaccinations', authRequired, async (req, res) => {
      try {
        const vacs = await vaccinations.find({ petId: req.params.petId, userId: req.userId }).toArray();
        return res.json(vacs);
      } catch (error) {
        console.error('Get vaccinations error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/pets/:petId/vaccinations', authRequired, async (req, res) => {
      try {
        const { name, date, nextDue } = req.body;
        const id = getUserId();
        const timestamp = now();
        const vac = { id, petId: req.params.petId, userId: req.userId, name, date, nextDue, created_at: timestamp };

        await vaccinations.insertOne(vac);
        return res.status(201).json(vac);
      } catch (error) {
        console.error('Create vaccination error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Diet Plans Endpoints ============
    app.get('/api/pets/:petId/diet-plans', authRequired, async (req, res) => {
      try {
        const plans = await dietPlans.find({ petId: req.params.petId, userId: req.userId }).toArray();
        return res.json(plans);
      } catch (error) {
        console.error('Get diet plans error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/pets/:petId/diet-plans', authRequired, async (req, res) => {
      try {
        const { name, description, startDate } = req.body;
        const id = getUserId();
        const timestamp = now();
        const plan = { id, petId: req.params.petId, userId: req.userId, name, description, startDate, created_at: timestamp };

        await dietPlans.insertOne(plan);
        return res.status(201).json(plan);
      } catch (error) {
        console.error('Create diet plan error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Doctor Appointments Endpoints ============
    app.post('/api/doctor-appointments', authRequired, async (req, res) => {
      try {
        const { petId, doctorName, date, time, reason } = req.body;
        if (!petId || !date) {
          return res.status(400).json({ error: 'petId and date are required' });
        }

        const id = getUserId();
        const timestamp = now();
        const appointment = { 
          id, petId, userId: req.userId, doctorName, date, time, reason, 
          status: 'confirmed', created_at: timestamp, updated_at: timestamp 
        };

        await doctorAppointments.insertOne(appointment);
        return res.status(201).json(appointment);
      } catch (error) {
        console.error('Create doctor appointment error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/doctor-appointments', authRequired, async (req, res) => {
      try {
        const appts = await doctorAppointments.find({ userId: req.userId }).toArray();
        return res.json(appts);
      } catch (error) {
        console.error('Get doctor appointments error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/doctor-appointments/:id', authRequired, async (req, res) => {
      try {
        const appt = await doctorAppointments.findOne({ id: req.params.id, userId: req.userId });
        if (!appt) {
          return res.status(404).json({ error: 'appointment not found' });
        }
        return res.json(appt);
      } catch (error) {
        console.error('Get doctor appointment error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/doctor-appointments/availability', authRequired, async (req, res) => {
      try {
        const { date } = req.query;
        const slots = [
          { time: '09:00 AM', available: true },
          { time: '10:00 AM', available: true },
          { time: '02:00 PM', available: false },
          { time: '03:00 PM', available: true },
        ];
        return res.json({ date, slots });
      } catch (error) {
        console.error('Get doctor availability error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.patch('/api/doctor-appointments/:id/cancel', authRequired, async (req, res) => {
      try {
        const result = await doctorAppointments.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: { status: 'cancelled', updated_at: now() } },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'appointment not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Cancel doctor appointment (PATCH) error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/doctor-appointments/:id/cancel', authRequired, async (req, res) => {
      try {
        const result = await doctorAppointments.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: { status: 'cancelled', updated_at: now() } },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'appointment not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Cancel doctor appointment (POST) error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.patch('/api/doctor-appointments/:id', authRequired, async (req, res) => {
      try {
        const updateData = { ...req.body, updated_at: now() };
        const result = await doctorAppointments.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: updateData },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'appointment not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Update doctor appointment error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Grooming Endpoints ============
    app.post('/api/groomings', authRequired, async (req, res) => {
      try {
        const { petId, groomerName, date, time, services } = req.body;
        if (!petId || !date) {
          return res.status(400).json({ error: 'petId and date are required' });
        }

        const id = getUserId();
        const timestamp = now();
        const booking = { 
          id, petId, userId: req.userId, groomerName, date, time, services,
          status: 'confirmed', created_at: timestamp, updated_at: timestamp 
        };

        await groomingBookings.insertOne(booking);
        return res.status(201).json(booking);
      } catch (error) {
        console.error('Create grooming error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/groomings', authRequired, async (req, res) => {
      try {
        const bookings = await groomingBookings.find({ userId: req.userId }).toArray();
        return res.json(bookings);
      } catch (error) {
        console.error('Get groomings error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/groomings/:id', authRequired, async (req, res) => {
      try {
        const booking = await groomingBookings.findOne({ id: req.params.id, userId: req.userId });
        if (!booking) {
          return res.status(404).json({ error: 'grooming not found' });
        }
        return res.json(booking);
      } catch (error) {
        console.error('Get grooming error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.get('/api/groomings/availability', authRequired, async (req, res) => {
      try {
        const { date } = req.query;
        const slots = [
          { time: '08:00 AM', available: true },
          { time: '09:00 AM', available: true },
          { time: '11:00 AM', available: false },
          { time: '01:00 PM', available: true },
        ];
        return res.json({ date, slots });
      } catch (error) {
        console.error('Get grooming availability error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.patch('/api/groomings/:id/cancel', authRequired, async (req, res) => {
      try {
        const result = await groomingBookings.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: { status: 'cancelled', updated_at: now() } },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'grooming not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Cancel grooming (PATCH) error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.post('/api/groomings/:id/cancel', authRequired, async (req, res) => {
      try {
        const result = await groomingBookings.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: { status: 'cancelled', updated_at: now() } },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'grooming not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Cancel grooming (POST) error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.patch('/api/groomings/:id', authRequired, async (req, res) => {
      try {
        const updateData = { ...req.body, updated_at: now() };
        const result = await groomingBookings.findOneAndUpdate(
          { id: req.params.id, userId: req.userId },
          { $set: updateData },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          return res.status(404).json({ error: 'grooming not found' });
        }
        return res.json(result.value);
      } catch (error) {
        console.error('Update grooming error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    // ============ Dashboard Endpoints ============
    app.get('/api/dashboard', authRequired, async (req, res) => {
      try {
        const totalPets = await pets.countDocuments({ userId: req.userId });
        const upcomingAppointments = await doctorAppointments.countDocuments({ 
          userId: req.userId, 
          status: { $ne: 'cancelled' }
        });
        const upcomingGroomings = await groomingBookings.countDocuments({ 
          userId: req.userId, 
          status: { $ne: 'cancelled' }
        });

        return res.json({
          totalPets,
          upcomingAppointments,
          upcomingGroomings,
        });
      } catch (error) {
        console.error('Get dashboard error:', error);
        return res.status(500).json({ error: 'internal server error' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Backend server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  try {
    await client.close();
  } finally {
    process.exit();
  }
});
