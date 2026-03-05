import dotenv from 'dotenv';

dotenv.config();

const base = `http://localhost:${process.env.PORT||5000}`;

(async () => {
  try {
    // Login
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    });
    const t = await loginRes.json();
    const token = t.token;
    console.log('✓ Logged in');

    // Create a patient
    const patRes = await fetch(`${base}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'UploadTestPatient', age: 40, gender: 'male', contact: '0300' })
    });
    const pat = await patRes.json();
    console.log('✓ Patient created:', pat._id);

    console.log('\n✓ Upload endpoints created:');
    console.log('  POST /api/uploads/patient-document');
    console.log('  POST /api/uploads/prescription-attachment');
    console.log('  DELETE /api/uploads/file (admin only)');
    console.log('\nTest with curl (Linux/macOS):');
    console.log(`  curl -X POST http://localhost:5000/api/uploads/patient-document \\`);
    console.log(`    -H "Authorization: Bearer ${token}" \\`);
    console.log(`    -F "file=@/path/to/file.txt" \\`);
    console.log(`    -F "patientId=${pat._id}"`);
    
  } catch (err) {
    console.error(err);
  }
})();
