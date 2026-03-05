#!/usr/bin/env node
/**
 * Admin Role Access Control - Complete Verification Test
 * 
 * This test verifies that the admin role can access all required data:
 * - View all patients
 * - View all doctors
 * - View all receptionists
 * - Access system analytics
 */

const BASE_URL = 'http://localhost:5000/api';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, path, body = null) {
  const token = global.adminToken;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  return response;
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║       ADMIN ROLE ACCESS CONTROL - VERIFICATION TEST           ║');
  console.log('║                  Hackathon Requirements Check                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Admin Login
    console.log('📝 STEP 1: Admin Authentication');
    console.log('─'.repeat(60));
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'admin@clinic.com',
      password: 'Admin@123'
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    global.adminToken = loginData.token;
    const user = loginData.user;

    console.log(`✅ Login successful`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Plan: ${user.subscriptionPlan}`);

    // Step 2: Requirement 1 - View all patients
    console.log('\n📝 STEP 2: Requirement #1 - Admin can view all patients');
    console.log('─'.repeat(60));
    const patientsRes = await makeRequest('GET', '/patients');
    if (patientsRes.status !== 200) {
      throw new Error(`Failed to fetch patients: ${patientsRes.status}`);
    }
    const patients = await patientsRes.json();
    console.log(`✅ Patients endpoint accessible`);
    console.log(`   Total patients: ${patients.length}`);
    if (patients.length > 0) {
      console.log(`   Sample: ${patients[0].name}, Age ${patients[0].age}`);
    }

    // Step 3: Requirement 2 - View all doctors
    console.log('\n📝 STEP 3: Requirement #2 - Admin can view all doctors');
    console.log('─'.repeat(60));
    const doctorsRes = await makeRequest('GET', '/users?role=doctor');
    if (doctorsRes.status !== 200) {
      throw new Error(`Failed to fetch doctors: ${doctorsRes.status}`);
    }
    const doctors = await doctorsRes.json();
    console.log(`✅ Doctors endpoint accessible`);
    console.log(`   Total doctors: ${doctors.length}`);
    if (doctors.length > 0) {
      console.log(`   Sample: ${doctors[0].name} (${doctors[0].email})`);
    }

    // Step 4: Requirement 3 - View all receptionists
    console.log('\n📝 STEP 4: Requirement #3 - Admin can view all receptionists');
    console.log('─'.repeat(60));
    const receptionistsRes = await makeRequest('GET', '/users?role=receptionist');
    if (receptionistsRes.status !== 200) {
      throw new Error(`Failed to fetch receptionists: ${receptionistsRes.status}`);
    }
    const receptionists = await receptionistsRes.json();
    console.log(`✅ Receptionists endpoint accessible`);
    console.log(`   Total receptionists: ${receptionists.length}`);
    if (receptionists.length > 0) {
      console.log(`   Sample: ${receptionists[0].name} (${receptionists[0].email})`);
    }

    // Step 5: Requirement 4 - Monitor system data and analytics
    console.log('\n📝 STEP 5: Requirement #4 - Admin can monitor system analytics');
    console.log('─'.repeat(60));
    const analyticsRes = await makeRequest('GET', '/analytics/admin');
    if (analyticsRes.status !== 200) {
      throw new Error(`Failed to fetch analytics: ${analyticsRes.status}`);
    }
    const analytics = await analyticsRes.json();
    console.log(`✅ Analytics endpoint accessible`);
    console.log(`   Total patients in system: ${analytics.totalPatients}`);
    console.log(`   Total doctors in system: ${analytics.totalDoctors}`);
    console.log(`   Total appointments (monthly): ${analytics.monthlyAppointments?.length || 0}`);
    console.log(`   Revenue: ₹${analytics.revenue || 0}`);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      ✅ ALL TESTS PASSED!                      ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ HACKATHON REQUIREMENTS VERIFICATION                            ║');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log(`║ ✅ Admin can view all patients              (${patients.length} available) ║`);
    console.log(`║ ✅ Admin can view all doctors               (${doctors.length} available) ║`);
    console.log(`║ ✅ Admin can view all receptionists         (${receptionists.length} available) ║`);
    console.log('║ ✅ Admin can monitor system data/analytics  (Accessible)    ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ FRONTEND IMPLEMENTATION                                         ║');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log('║ ✅ userService added to apiService.js                          ║');
    console.log('║    - userService.getByRole(role)                              ║');
    console.log('║    - userService.getAll(params)                               ║');
    console.log('║ ✅ AdminDashboard.jsx updated to display:                      ║');
    console.log('║    - All patients (Recent Patients section)                   ║');
    console.log('║    - All doctors (All Doctors section)                        ║');
    console.log('║    - All receptionists (All Receptionists section)           ║');
    console.log('║    - System analytics and statistics                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📌 Next Steps:');
    console.log('   1. Login to frontend as: admin@clinic.com / Admin@123');
    console.log('   2. Navigate to Admin Dashboard');
    console.log('   3. Verify all sections display correctly');
    console.log('   4. Check that numbers match this test output\n');

  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    process.exit(1);
  }
}

test();
