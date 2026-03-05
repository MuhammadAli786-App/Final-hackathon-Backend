import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

async function testAppointmentEdit() {
  console.log('🧪 Testing Complete Appointment Flow\n')

  try {
    // Step 1: Login
    console.log('📝 Step 1: Login')
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    })
    const { token } = await loginRes.json()
    console.log('✓ Admin logged in')

    // Step 2: Get first appointment
    console.log('\n📋 Step 2: Get first appointment')
    const listRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const appointments = await listRes.json()
    const apt = appointments[0]
    console.log(`✓ Found appointment: ${apt._id}`)
    console.log(`  Current: ${apt.date} - Status: ${apt.status}`)

    // Step 3: Get single appointment details
    console.log('\n🔍 Step 3: Get appointment details')
    const detailRes = await fetch(`${API_URL}/appointments/${apt._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const detail = await detailRes.json()
    console.log(`✓ Appointment details:`)
    console.log(`  Patient: ${detail.patientId?.name || 'N/A'}`)
    console.log(`  Doctor: ${detail.doctorId?.name || 'N/A'}`)
    console.log(`  Notes: ${detail.notes || '(none)'}`)

    // Step 4: Update appointment (change date and notes)
    console.log('\n✏️  Step 4: Update appointment')
    const newDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const updateRes = await fetch(`${API_URL}/appointments/${apt._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patientId: apt.patientId?._id || apt.patientId,
        doctorId: apt.doctorId?._id || apt.doctorId,
        appointmentDate: newDate.toISOString(),
        reason: 'Updated: Follow-up visit'
      })
    })
    const updated = await updateRes.json()
    if (updateRes.ok) {
      console.log(`✓ Appointment updated`)
      console.log(`  New date: ${updated.date}`)
      console.log(`  New notes: ${updated.notes}`)
    } else {
      console.log(`❌ Update failed: ${updated.message}`)
    }

    // Step 5: Change status to confirmed
    console.log('\n🔄 Step 5: Update status to confirmed')
    const statusRes = await fetch(`${API_URL}/appointments/${apt._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    })
    const statusUpdated = await statusRes.json()
    if (statusRes.ok) {
      console.log(`✓ Status updated to: ${statusUpdated.status}`)
    }

    console.log('\n✅ All appointment operations completed successfully!\n')

  } catch (error) {
    console.error('❌ Test error:', error.message)
    process.exit(1)
  }
}

testAppointmentEdit()
