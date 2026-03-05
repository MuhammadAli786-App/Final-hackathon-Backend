import fetch from 'node-fetch';

async function main() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'patient@clinic.com',password:'Patient@123'})
  });
  const data = await loginRes.json();
  const token = data.token;
  console.log('logged in, token?', !!token);
  
  const patResp = await fetch(`http://localhost:5000/api/patients/${data.user._id}`, {headers:{Authorization:'Bearer '+token}});
  console.log('GET /patients/:id ->', patResp.status);
  console.log(await patResp.text());
  
  const apptsResp = await fetch(`http://localhost:5000/api/appointments?patientId=${data.user._id}`, {headers:{Authorization:'Bearer '+token}});
  console.log('GET /appointments?patientId= ->', apptsResp.status);
  console.log(await apptsResp.text());
}

main().catch(console.error);
