import dotenv from 'dotenv';

dotenv.config();

const base = `http://localhost:${process.env.PORT||5000}`;

const run = async ()=>{
  try{
    console.log('Starting smoke test, base URL:', base);
    // Login
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.SEED_ADMIN_EMAIL || 'admin@clinic.com', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123' })
    });
    console.log('Login HTTP status:', loginRes.status);
    const loginJson = await loginRes.json();
    console.log('Login response:', loginJson);
    if(!loginJson.token){
      console.error('Login failed, aborting smoke test');
      process.exit(1);
    }
    const token = loginJson.token;

    // Create patient
    const patientRes = await fetch(`${base}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test Patient', age: 30, gender: 'male', contact: '0123456789' })
    });
    const patientJson = await patientRes.json();
    console.log('Create patient status:', patientRes.status);
    console.log(patientJson);
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
};

run();
