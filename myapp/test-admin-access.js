// Test admin access to patients, doctors, and receptionists endpoints

const BASE_URL = 'http://localhost:5000';

let adminToken = '';

async function test() {
  try {
    // Step 1: Login as admin
    console.log('\n1️⃣ Login as admin');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    console.log(`   Full login response:`, JSON.stringify(loginData, null, 2));
    adminToken = loginData.token || loginData.data?.token;
    const user = loginData.user || loginData.data?.user;
    console.log(`✅ Admin logged in: ${user?.email}`);
    console.log(`   Token: ${adminToken?.slice(0, 20)}...`);
    console.log(`   Role: ${user?.role}`);

    // Step 2: Test GET /api/patients
    console.log('\n2️⃣ GET /api/patients (List all patients)');
    const patientsRes = await fetch(`${BASE_URL}/api/patients`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   Status: ${patientsRes.status}`);
    const patientsData = await patientsRes.json();
    console.log(`   Response: ${JSON.stringify(patientsData).slice(0, 100)}...`);
    if (patientsRes.ok) {
      console.log(`   ✅ Admin can fetch patients: ${patientsData?.length || 0} patients`);
    } else {
      console.log(`   ❌ Error: ${patientsData?.message || 'Unknown error'}`);
    }

    // Step 3: Test GET /api/users?role=doctor
    console.log('\n3️⃣ GET /api/users?role=doctor (List all doctors)');
    const doctorsRes = await fetch(`${BASE_URL}/api/users?role=doctor`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   Status: ${doctorsRes.status}`);
    const doctorsData = await doctorsRes.json();
    console.log(`   Response: ${JSON.stringify(doctorsData).slice(0, 100)}...`);
    if (doctorsRes.ok) {
      console.log(`   ✅ Admin can fetch doctors: ${doctorsData?.length || 0} doctors`);
    } else {
      console.log(`   ❌ Error: ${doctorsData?.message || 'Unknown error'}`);
    }

    // Step 4: Test GET /api/users?role=receptionist
    console.log('\n4️⃣ GET /api/users?role=receptionist (List all receptionists)');
    const receptionistsRes = await fetch(`${BASE_URL}/api/users?role=receptionist`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   Status: ${receptionistsRes.status}`);
    const receptionistsData = await receptionistsRes.json();
    console.log(`   Response: ${JSON.stringify(receptionistsData).slice(0, 100)}...`);
    if (receptionistsRes.ok) {
      console.log(`   ✅ Admin can fetch receptionists: ${receptionistsData?.length || 0} receptionists`);
    } else {
      console.log(`   ❌ Error: ${receptionistsData?.message || 'Unknown error'}`);
    }

    // Step 5: Test GET /api/analytics/admin
    console.log('\n5️⃣ GET /api/analytics/admin (Admin statistics)');
    const analyticsRes = await fetch(`${BASE_URL}/api/analytics/admin`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   Status: ${analyticsRes.status}`);
    const analyticsData = await analyticsRes.json();
    console.log(`   Response keys: ${Object.keys(analyticsData).join(', ')}`);
    if (analyticsRes.ok) {
      console.log(`   ✅ Admin can fetch analytics`);
    } else {
      console.log(`   ❌ Error: ${analyticsData?.message || 'Unknown error'}`);
    }

    console.log('\n✅ All tests completed!');
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

test();
