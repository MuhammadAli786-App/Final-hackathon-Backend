import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

async function debugSubscription() {
  try {
    // Login as doctor
    const doctorRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@clinic.com', password: 'Doctor@123' })
    })
    const doctorData = await doctorRes.json()
    console.log('Doctor login response:', doctorData)
    const doctorToken = doctorData.token
    console.log('Doctor token:', doctorToken)
    try {
      const jwt = (await import('jsonwebtoken')).default
      const decoded = jwt.verify(doctorToken, process.env.JWT_SECRET)
      console.log('Doctor token payload:', decoded)
    } catch (err) {
      console.log('Doctor token decode error:', err.message)
    }

    // Login as patient
    const patientRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@clinic.com', password: 'Doctor@123' })
    })
    const patientData = await patientRes.json()
    console.log('Patient login response:', patientData)
    const patientToken = patientData.token
    console.log('Patient token:', patientToken)
    try {
      const jwt = (await import('jsonwebtoken')).default
      const decoded2 = jwt.verify(patientToken, process.env.JWT_SECRET)
      console.log('Patient token payload:', decoded2)
    } catch (err) {
      console.log('Patient token decode error:', err.message)
    }

    // Get subscription status using doctor token
    const statusRes = await fetch(`${API_URL}/subscriptions/status`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    })
    const statusData = await statusRes.json()
    
    console.log('\nSubscription Status Response:')
    console.log(JSON.stringify(statusData, null, 2))

    // Get plans
    const plansRes = await fetch(`${API_URL}/subscriptions/plans`)
    const plansData = await plansRes.json()
    console.log('\nPlans:')
    console.log(JSON.stringify(plansData, null, 2))

  } catch (error) {
    console.error('Error:', error.message)
  }
}

debugSubscription()
