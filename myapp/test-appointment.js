import fetch from 'node-fetch';

async function run() {
  // login and schedule
  const loginRes = await fetch('http://localhost:5000/api/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'patient@clinic.com', password:'Patient@123'})
  });
  const data = await loginRes.json();
  const token = data.token;
  console.log('token ok', !!token);

  // fetch a real doctor id
  const doctorsRes = await fetch('http://localhost:5000/api/users?role=doctor', {
    headers: { Authorization: 'Bearer '+token }
  });
  const doctors = await doctorsRes.json();
  const doctorId = doctors.length ? doctors[0]._id : null;
  console.log('using doctorId', doctorId);

  // try booking
  const apptRes = await fetch('http://localhost:5000/api/appointments', {
    method:'POST',
    headers: { 'Content-Type':'application/json', Authorization: 'Bearer '+token },
    body: JSON.stringify({
      patientId: data.user._id,
      doctorId,
      appointmentDate: new Date().toISOString(),
      reason: 'test appointment'
    })
  });
  const body = await apptRes.text();
  console.log('create status', apptRes.status, body);
}

run().catch(console.error);
