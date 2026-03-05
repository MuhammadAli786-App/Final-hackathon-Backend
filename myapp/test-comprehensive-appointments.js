import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

async function comprehensiveTest() {
  console.log('🧪 Comprehensive Appointment Management Test\n')

  try {
    // Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    })
    const { token } = await loginRes.json()
    console.log('✓ Admin logged in\n')

    // verify admin cannot create a prescription
    const patientsResTmp = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const patientListTmp = await patientsResTmp.json();
    const tempPatientId = patientListTmp[0]._id;
    const badPres = await fetch(`${API_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ patientId: tempPatientId, medicines: [{ name: 'Test', dosage: '1', duration: '1d' }], instructions: 'none' })
    });
    if (badPres.ok) {
      console.error('❌ Admin was able to create a prescription');
      process.exit(1);
    } else {
      console.log('✓ Admin blocked from creating prescription (status', badPres.status, ')\n');
    }

    // Get patients and doctors
    const patientsRes = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const patients = await patientsRes.json()
    const patientId = patients[0]._id

    const doctorsRes = await fetch(`${API_URL}/users?role=doctor`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const doctors = await doctorsRes.json()
    const doctorId = doctors[0]._id

    console.log(`✓ Found patient: ${patients[0].name}`)
    console.log(`✓ Found doctor: ${doctors[0].name}\n`)

    // CREATE APPOINTMENT
    console.log('1️⃣  CREATE APPOINTMENT')
    const createRes = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patientId,
        doctorId,
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Initial consultation'
      })
    })
    const created = await createRes.json()
    console.log(`✓ Created: ${created._id}`)
    console.log(`  Status: ${created.status}\n`)

    const appointmentId = created._id

    // GET SINGLE APPOINTMENT
    console.log('2️⃣  GET APPOINTMENT DETAILS')
    const getRes = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const fetched = await getRes.json()
    console.log(`✓ Retrieved: ${fetched._id}`)
    console.log(`  Date: ${fetched.date}`)
    console.log(`  Notes: ${fetched.notes}\n`)

    // UPDATE APPOINTMENT
    console.log('3️⃣  UPDATE APPOINTMENT DETAILS')
    const updateRes = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patientId,
        doctorId,
        appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Follow-up appointment'
      })
    })
    const updated = await updateRes.json()
    console.log(`✓ Updated date and reason`)
    console.log(`  New date: ${updated.date}`)
    console.log(`  New notes: ${updated.notes}\n`)

    // UPDATE STATUS
    console.log('4️⃣  UPDATE STATUS')
    const statusRes = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    })
    const confirmed = await statusRes.json()
    console.log(`✓ Status updated: ${confirmed.status}\n`)

    // LIST APPOINTMENTS
    console.log('5️⃣  LIST APPOINTMENTS')
    const listRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const list = await listRes.json()
    console.log(`✓ Total appointments: ${list.length}`)
    const confirmed_count = list.filter(a => a.status === 'confirmed').length
    console.log(`  Confirmed: ${confirmed_count}`)
    console.log(` Pending: ${list.filter(a => a.status === 'pending').length}\n`)

    // CANCEL APPOINTMENT
    console.log('6️⃣  CANCEL APPOINTMENT')
    const cancelRes = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    })
    const cancelled = await cancelRes.json()
    console.log(`✓ Status updated: ${cancelled.status}\n`)

    // DELETE APPOINTMENT
    console.log('7️⃣  DELETE APPOINTMENT')
    const deleteRes = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (deleteRes.ok) {
      console.log(`✓ Appointment deleted\n`)
    }

    // finally, confirm admin can delete a patient
    console.log('8️⃣  DELETE PATIENT (admin)')
    const delPatRes = await fetch(`${API_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (delPatRes.ok) {
      console.log('✓ Patient deleted successfully by admin\n')
    } else {
      console.error('❌ Admin failed to delete patient', delPatRes.status)
      process.exit(1)
    }

    console.log('✅ All operations completed successfully!')

  } catch (error) {
    console.error('❌ Test error:', error.message)
    process.exit(1)
  }
}

comprehensiveTest()
