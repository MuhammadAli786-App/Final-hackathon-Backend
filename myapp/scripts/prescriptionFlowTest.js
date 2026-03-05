import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const base = `http://localhost:${process.env.PORT||5000}`;

const run = async ()=>{
  try{
    // Login as admin
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.SEED_ADMIN_EMAIL || 'admin@clinic.com', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123' })
    });
    const loginJson = await loginRes.json();
    if(!loginJson.token) throw new Error('Login failed: '+JSON.stringify(loginJson));
    let token = loginJson.token;

    // Create patient (admin permitted)
    const patientRes = await fetch(`${base}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'PDF Patient', age: 29, gender: 'female', contact: '0300123000' })
    });
    const patientJson = await patientRes.json();
    if(!patientJson._id) throw new Error('Patient creation failed: '+JSON.stringify(patientJson));

    // attempt prescription creation as admin (should fail)
    const badPresRes = await fetch(`${base}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ patientId: patientJson._id, medicines: [{ name: 'Ibuprofen', dosage: '200mg', duration: '3 days' }], instructions: 'Take twice daily' })
    });
    if (badPresRes.ok) {
      console.error('❌ Admin was able to create a prescription when they should not');
      process.exit(1);
    } else {
      console.log('✓ Admin prevented from creating prescription (status', badPresRes.status, ')');
    }

    // login as doctor for prescription creation
    const doctorRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.SEED_DOCTOR_EMAIL || 'doctor@clinic.com', password: process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123' })
    });
    const doctorJson = await doctorRes.json();
    if(!doctorJson.token) throw new Error('Doctor login failed: '+JSON.stringify(doctorJson));
    token = doctorJson.token;

    // Create prescription as doctor
    const prescriptionRes = await fetch(`${base}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ patientId: patientJson._id, medicines: [{ name: 'Paracetamol', dosage: '500mg', duration: '5 days' }], instructions: 'Take after food' })
    });
    const presJson = await prescriptionRes.json();
    if(!presJson._id) throw new Error('Prescription creation failed: '+JSON.stringify(presJson));

    console.log('Prescription created by doctor:', presJson._id);

    // Download PDF
    const pdfRes = await fetch(`${base}/api/prescriptions/${presJson._id}/pdf`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if(pdfRes.status !== 200) {
      console.error('PDF fetch failed', pdfRes.status, await pdfRes.text());
      process.exit(1);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outPath = `downloaded-prescription-${presJson._id}.pdf`;
    fs.writeFileSync(outPath, buffer);
    console.log('Saved PDF to', outPath);
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
};

run();
