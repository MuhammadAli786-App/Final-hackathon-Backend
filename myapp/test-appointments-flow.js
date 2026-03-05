import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

const creds = {
  admin: { email: 'admin@clinic.com', password: 'Admin@123' },
  patient: { email: 'patient@clinic.com', password: 'Patient@123' },
  doctor: { email: 'doctor@clinic.com', password: 'Doctor@123' }
}

async function testAppointmentFlow() {
  console.log('🧪 Testing Appointment Flow\n')

  try {
    // Step 1: Login users
    console.log('📝 Step 1: Login users')
    const tokens = {}
    for (const [role, cred] of Object.entries(creds)) {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      })
      const data = await res.json()
      if (data.token) {
        tokens[role] = data.token
        console.log(`✓ ${role}: Logged in`)
      }
    }

    // Step 2: Get patients and doctors
    console.log('\n📋 Step 2: Fetch patients and doctors')
    const patientsRes = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    })
    const patients = await patientsRes.json()
    console.log(`✓ Found ${patients.length} patients`)

    const doctorsRes = await fetch(`${API_URL}/users?role=doctor`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    })
    const doctors = await doctorsRes.json()
    console.log(`✓ Found ${doctors.length} doctors`)

    if (patients.length === 0 || doctors.length === 0) {
      console.log('⚠️  Skipping appointment creation - need at least 1 patient and 1 doctor')
      process.exit(0)
    }

    // Step 3: Create appointment as admin (simpler for testing)
    console.log('\n✏️  Step 3: Create appointment as admin')
    const appointmentData = {
      patientId: patients[0]._id,
      doctorId: doctors[0]._id,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Regular checkup'
    }

    const createRes = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.admin}`
      },
      body: JSON.stringify(appointmentData)
    })
    const createdApt = await createRes.json()
    if (createRes.ok) {
      console.log(`✓ Appointment created: ${createdApt._id}`)
      console.log(`  Patient: ${createdApt.patientId}`)
      console.log(`  Doctor: ${createdApt.doctorId}`)
      console.log(`  Date: ${createdApt.date}`)
      console.log(`  Notes: ${createdApt.notes || '(empty)'}`)
    } else {
      console.log(`❌ Failed to create appointment: ${createdApt.message}`)
      process.exit(1)
    }

    // Step 4: Get all appointments
    console.log('\n📋 Step 4: Get all appointments')
    const allAptRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    })
    const allApts = await allAptRes.json()
    console.log(`✓ Found ${allApts.length} total appointments`)

    // Step 5: Get patient appointments (with populated data)
    console.log('\n👤 Step 5: Get patient appointments with populated data')
    const patientAptRes = await fetch(`${API_URL}/appointments?patientId=${patients[0]._id}`, {
      headers: { 'Authorization': `Bearer ${tokens.patient}` }
    })
    const patientApts = await patientAptRes.json()
    console.log(`✓ Found ${patientApts.length} appointments for patient`)
    if (patientApts.length > 0) {
      const apt = patientApts[0]
      console.log(`  First appointment:`)
      console.log(`    Date: ${apt.date}`)
      console.log(`    Status: ${apt.status}`)
      console.log(`    Notes: ${apt.notes || 'N/A'}`)
      console.log(`    Patient name: ${apt.patientId?.name || 'N/A'}`)
      console.log(`    Doctor name: ${apt.doctorId?.name || 'N/A'}`)
    }

    // Step 6: Cancel appointment
    console.log('\n❌ Step 6: Cancel appointment')
    const cancelRes = await fetch(`${API_URL}/appointments/${createdApt._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.admin}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    })
    const canceledApt = await cancelRes.json()
    if (cancelRes.ok) {
      console.log(`✓ Appointment cancelled`)
      console.log(`  Status: ${canceledApt.status}`)
    }

    console.log('\n✅ All appointment tests completed successfully!\n')

  } catch (error) {
    console.error('❌ Test error:', error.message)
    process.exit(1)
  }
}

testAppointmentFlow()
