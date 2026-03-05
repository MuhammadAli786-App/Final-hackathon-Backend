import fetch from 'node-fetch'

const testCredentials = [
  { email: 'admin@clinic.com', password: 'Admin@123' },
  { email: 'doctor@clinic.com', password: 'Doctor@123' },
  { email: 'receptionist@clinic.com', password: 'Receptionist@123' },
  { email: 'patient@clinic.com', password: 'Patient@123' }
]

const testAllLogins = async () => {
  console.log('🧪 Testing login with all demo credentials\n')
  
  for (const cred of testCredentials) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      })
      const data = await res.json()
      
      const status = data.status ? '✅ SUCCESS' : '❌ FAILED'
      console.log(`${status} - ${cred.email} / ${cred.password}`)
      if (!data.status) console.log(`  Error: ${data.message}`)
    } catch (err) {
      console.log(`⚠️ ERROR - ${cred.email}: ${err.message}`)
    }
  }
}

testAllLogins()
