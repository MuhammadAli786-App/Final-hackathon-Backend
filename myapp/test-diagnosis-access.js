import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'
const creds = {
  admin: { email: 'admin@clinic.com', password: 'Admin@123' },
  doctor: { email: 'doctor@clinic.com', password: 'Doctor@123' },
  patient: { email: 'patient@clinic.com', password: 'Patient@123' }
}

async function login(role) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(creds[role])
  })
  const data = await res.json()
  return data.token
}

async function test() {
  const doctorToken = await login('doctor')
  const adminToken = await login('admin')
  const patientToken = await login('patient')

  const payload = { symptoms: 'cough', age: 30, gender: 'male', history: {} }
  for (const [role, token] of [['doctor', doctorToken], ['admin', adminToken], ['patient', patientToken]]) {
    const res = await fetch(`${API_URL}/diagnosis/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    const text = await res.text()
    console.log(`${role} status: ${res.status}, body: ${text}`)
  }
}

test()