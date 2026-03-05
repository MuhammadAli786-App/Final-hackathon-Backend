import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import userModel from '../models/userSchema.js';

(async () => {
  await connectDB();
  const doctor = await userModel.findOne({ email: 'doctor@clinic.com' });
  console.log('Doctor user:', doctor);
  const reception = await userModel.findOne({ email: 'receptionist@clinic.com' });
  console.log('Reception user:', reception);
  const patient = await userModel.findOne({ email: 'patient@clinic.com' });
  console.log('Patient user:', patient);
  process.exit(0);
})();