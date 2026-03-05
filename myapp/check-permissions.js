import fetch from 'node-fetch';

async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'patient@clinic.com', password:'Patient@123'})
  });
  const data = await loginRes.json();
  const token = data.token;
  console.log('patient token', token ? 'present' : 'none');

  const res1 = await fetch('http://localhost:5000/api/patients', { headers:{Authorization:'Bearer '+token}});
  console.log('GET /patients', res1.status);
  console.log(await res1.text());

  // try specific id - need one valid id from previous
  if (res1.status === 200) {
    const arr = await res1.json();
    if (arr.length > 0) {
      const id = arr[0]._id;
      const res2 = await fetch('http://localhost:5000/api/patients/'+id, { headers:{Authorization:'Bearer '+token}});
      console.log('GET /patients/:id', res2.status);
      console.log(await res2.text());
    }
  }
}

run().catch(console.error);
