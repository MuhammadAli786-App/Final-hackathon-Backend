import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

async function debugAppointment() {
  console.log('🧪 Debugging Appointment Data\n')

  try {
    // Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', password: 'Admin@123' })
    })
    const { token } = await loginRes.json()
    console.log('✓ Admin logged in\n')

    // Get appointment
    const listRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const appointments = await listRes.json()
    const apt = appointments[0]

    console.log('📋 Appointment from list endpoint:')
    console.log(JSON.stringify(apt, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugAppointment()
