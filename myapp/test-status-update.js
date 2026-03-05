import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

async function testStatusUpdate() {
  console.log('🧪 Testing Appointment Status Update\n')

  try {
    // Step 1: Login as admin
    console.log('📝 Step 1: Login as admin')
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    })
    const loginData = await loginRes.json()
    const adminToken = loginData.token
    console.log(`✓ Admin logged in`)

    // Step 2: Get an appointment
    console.log('\n📋 Step 2: Get appointments')
    const listRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    const appointments = await listRes.json()
    console.log(`✓ Found ${appointments.length} appointments`)

    if (appointments.length === 0) {
      console.log('⚠️  No appointments to update')
      process.exit(0)
    }

    const apt = appointments[0]
    console.log(`  First appointment ID: ${apt._id}`)
    console.log(`  Current status: ${apt.status}`)

    // Step 3: Try to update status
    console.log('\n🔄 Step 3: Update appointment status')
    const updateRes = await fetch(`${API_URL}/appointments/${apt._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    })

    console.log(`  Response status: ${updateRes.status}`)
    const updateData = await updateRes.json()
    
    if (updateRes.ok) {
      console.log(`✓ Status updated successfully`)
      console.log(`  New status: ${updateData.status}`)
    } else {
      console.log(`❌ Error updating status:`)
      console.log(JSON.stringify(updateData, null, 2))
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
    process.exit(1)
  }
}

testStatusUpdate()
