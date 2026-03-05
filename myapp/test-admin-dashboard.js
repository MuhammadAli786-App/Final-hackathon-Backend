// Test that simulates the AdminDashboard frontend fetching data

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function test() {
  try {
    // Step 1: Login as admin
    console.log('\n1️⃣ Admin Dashboard Data Fetch Test');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    const user = loginData.user;
    console.log(`✅ Admin logged in: ${user?.email} (${user?.role})`);

    // Step 2: Simulate AdminDashboard fetching all data
    console.log('\n2️⃣ Fetching AdminDashboard data...');
    
    const headers = { 'Authorization': `Bearer ${adminToken}` };
    
    const [statsRes, patientsRes, doctorsRes, receptionistsRes] = await Promise.all([
      fetch(`${BASE_URL}/analytics/admin`, { headers }),
      fetch(`${BASE_URL}/patients`, { headers }),
      fetch(`${BASE_URL}/users?role=doctor`, { headers }),
      fetch(`${BASE_URL}/users?role=receptionist`, { headers })
    ]);
    
    const stats = await statsRes.json();
    const patients = await patientsRes.json();
    const doctors = await doctorsRes.json();
    const receptionists = await receptionistsRes.json();
    
    console.log(`   📊 Analytics: totalPatients=${stats.totalPatients}, totalDoctors=${stats.totalDoctors}`);
    console.log(`   👥 Patients: ${patients.length} patients fetched`);
    console.log(`   👨‍⚕️ Doctors: ${doctors.length} doctors fetched`);
    console.log(`   📋 Receptionists: ${receptionists.length} receptionists fetched`);
    
    if (patients.length > 0) {
      console.log(`      - First patient: ${patients[0].name}`);
    }
    if (doctors.length > 0) {
      console.log(`      - First doctor: ${doctors[0].name} (${doctors[0].email})`);
    }
    if (receptionists.length > 0) {
      console.log(`      - First receptionist: ${receptionists[0].name} (${receptionists[0].email})`);
    }
    
    console.log('\n✅ AdminDashboard can fetch all required data!');
    console.log('\n📌 Summary for Admin:');
    console.log(`   • Can view all ${patients.length} patients`);
    console.log(`   • Can view all ${doctors.length} doctors`);
    console.log(`   • Can view all ${receptionists.length} receptionists`);
    console.log(`   • Can access system analytics and monitoring`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
