import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'
const creds = { email: 'doctor@clinic.com', password: 'Doctor@123' }

async function doctorWorkflowTest() {
  console.log('🩺 Doctor Workflow Test\n')

  try {
    // login as doctor
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    })
    const loginJson = await loginRes.json()
    if (!loginJson.token) {
      console.error('❌ Doctor login failed', loginJson)
      process.exit(1)
    }
    const token = loginJson.token
    console.log('✓ Doctor logged in')

    // fetch doctor id for later filters
    const docsRes = await fetch(`${API_URL}/users?role=doctor`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const docs = await docsRes.json()
    const doctor = docs.find(d => d.email === creds.email) || docs[0]
    const doctorId = doctor?._id
    console.log(`✓ Doctor id: ${doctorId}\n`)

    // 1. Doctor creates a patient
    console.log('1️⃣  CREATE PATIENT')
    const createPatientRes = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Dr Test Patient',
        age: 40,
        gender: 'male',
        contact: '0300111222',
        address: '123 Test St'
      })
    })
    const createdPatient = await createPatientRes.json()
    if (!createPatientRes.ok) {
      console.error('❌ Failed to create patient', createdPatient)
      process.exit(1)
    }
    console.log(`✓ Patient created: ${createdPatient._id}\n`)

    const patientId = createdPatient._id

    // 2. Doctor views patient list
    console.log('2️⃣  VIEW PATIENTS LIST')
    const listRes = await fetch(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const list = await listRes.json()
    console.log(`✓ Total patients returned: ${list.length}`)
    if (!list.some(p => p._id === patientId)) {
      console.error('❌ Created patient not in list')
      process.exit(1)
    }
    console.log('  ✓ Created patient present\n')

    // 3. Update patient
    console.log('3️⃣  UPDATE PATIENT INFO')
    const updRes = await fetch(`${API_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ contact: '0300999888', address: '456 New Rd' })
    })
    const updatedPatient = await updRes.json()
    console.log(`✓ Updated contact: ${updatedPatient.contact}`)
    console.log(`  Updated address: ${updatedPatient.address}\n`)

    // 4. Schedule appointment
    console.log('4️⃣  CREATE APPOINTMENT')
    const aptData = {
      patientId,
      doctorId,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Doctor workflow check'
    }
    const createAptRes = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(aptData)
    })
    const appointment = await createAptRes.json()
    if (!createAptRes.ok) {
      console.error('❌ Failed to create appointment', appointment)
      process.exit(1)
    }
    console.log(`✓ Appointment created: ${appointment._id}\n`)
    const appointmentId = appointment._id

    // 5. View doctor's appointments
    console.log("5️⃣  VIEW DOCTOR'S APPOINTMENTS")
    const docAptRes = await fetch(`${API_URL}/appointments?doctorId=${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const docApts = await docAptRes.json()
    console.log(`✓ Found ${docApts.length} appointments for doctor`)
    if (!docApts.some(a => a._id === appointmentId)) {
      console.error('❌ Created appointment not in doctor list')
      process.exit(1)
    }
    console.log('\n')

    // 6. Edit/reschedule appointment
    console.log('6️⃣  UPDATE APPOINTMENT DETAILS')
    const newDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const updateAptRes = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...aptData, appointmentDate: newDate, reason: 'Rescheduled' })
    })
    const updatedApt = await updateAptRes.json()
    console.log(`✓ Updated date to ${updatedApt.date}`)
    console.log(`  Updated notes: ${updatedApt.notes || '(none)'}\n`)

    // 7. Cancel appointment (status)
    console.log('7️⃣  CANCEL APPOINTMENT')
    const cancelRes = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    })
    const cancelledApt = await cancelRes.json()
    console.log(`✓ Status now: ${cancelledApt.status}\n`)

    // 8. Delete appointment
    console.log('8️⃣  DELETE APPOINTMENT')
    const delAptRes = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (delAptRes.ok) {
      console.log('✓ Appointment deleted\n')
    }

    // 9. AI Symptom Checker
    console.log('9️⃣  USE AI SYMPTOM CHECKER')
    const symptomRes = await fetch(`${API_URL}/diagnosis/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ symptoms: 'headache and fever', age: 40, gender: 'male', history: { patientId } })
    })
    const symptomJson = await symptomRes.json()
    if (!symptomRes.ok) {
      console.error('❌ Symptom checker failed', symptomJson)
      process.exit(1)
    }
    console.log('✓ Symptom checker returned result, logId', symptomJson.logId, '\n')
    const logId = symptomJson.logId

    // manual log creation
    console.log('✍️  CREATE MANUAL DIAGNOSIS LOG')
    const manualRes = await fetch(`${API_URL}/diagnosis/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ patientId, symptoms: 'manual entry: fatigue', aiResponse: null, riskLevel: 'low' })
    })
    const manualLog = await manualRes.json()
    if (!manualRes.ok) {
      console.error('❌ Manual log creation failed', manualLog)
      process.exit(1)
    }
    console.log('✓ Manual log created:', manualLog._id, '\n')

    // 10. View medical logs for patient
    console.log('🔟 VIEW DIAGNOSIS LOGS')
    const logsRes = await fetch(`${API_URL}/diagnosis/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const logs = await logsRes.json()
    console.log(`✓ Retrieved ${logs.length} logs for patient`)
    if (!logs.some(l => l._id === logId) || !logs.some(l => l._id === manualLog._id)) {
      console.error('❌ One of the created logs not found')
      process.exit(1)
    }
    const singleLogRes = await fetch(`${API_URL}/diagnosis/${logId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const singleLog = await singleLogRes.json()
    console.log('✓ Single log accessible')

    // update manual log
    const updateManual = await fetch(`${API_URL}/diagnosis/${manualLog._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symptoms: 'manual entry updated: severe fatigue' })
    })
    console.log(`   PUT manual log status ${updateManual.status}`)
    const afterUpdate = await updateManual.json()
    console.log('   updated symptoms:', afterUpdate.symptoms)

    // delete manual log
    const delManual = await fetch(`${API_URL}/diagnosis/${manualLog._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log(`   DELETE manual log status ${delManual.status}\n`)

    // 11. Create prescription
    console.log('1️⃣1️⃣  PRESCRIPTION MANAGEMENT')
    const presRes = await fetch(`${API_URL}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ patientId, medicines: [{ name: 'Aspirin', dosage: '100mg', duration: '7 days' }], instructions: 'Once daily' })
    })
    const presJson = await presRes.json()
    if (!presRes.ok) {
      console.error('❌ Prescription creation failed', presJson)
      process.exit(1)
    }
    console.log('✓ Prescription created', presJson._id)
    const presId = presJson._id
    // update
    const updatePresRes = await fetch(`${API_URL}/prescriptions/${presId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ medicines: [{ name: 'Aspirin', dosage: '150mg', duration: '7 days' }] })
    })
    const updatedPres = await updatePresRes.json()
    console.log('✓ Prescription updated dosage to', updatedPres.medicines && updatedPres.medicines[0] ? updatedPres.medicines[0].dosage : '(no data)')
    // delete
    const delPresRes = await fetch(`${API_URL}/prescriptions/${presId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (delPresRes.ok) console.log('✓ Prescription deleted\n')

    // 12. Delete patient
    console.log('1️⃣2️⃣  DELETE PATIENT')
    const delPatRes = await fetch(`${API_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (delPatRes.ok) {
      console.log('✓ Patient deleted by doctor\n')
    } else {
      console.error('❌ Doctor unable to delete patient', delPatRes.status)
      process.exit(1)
    }

    // 13. Analytics access check
    console.log('1️⃣3️⃣  ANALYTICS ACCESS')
    const adminAnRes = await fetch(`${API_URL}/analytics/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log(`   /analytics/admin status ${adminAnRes.status} (should be 403 or 401)`)    
    const docApt2 = await (await fetch(`${API_URL}/appointments?doctorId=${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })).json()
    console.log(`   Doctor can view own appointments count: ${docApt2.length}`)

    console.log('\n✅ Doctor workflow test completed successfully!')
  } catch (err) {
    console.error('❌ Test error:', err.message)
    process.exit(1)
  }
}

doctorWorkflowTest()
