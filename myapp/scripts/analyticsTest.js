import dotenv from 'dotenv';
dotenv.config();
const base = `http://localhost:${process.env.PORT||5000}`;
(async()=>{
  const loginRes = await fetch(`${base}/api/auth/login`,{
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'admin@clinic.com', password:'Admin@123'})
  });
  const t = await loginRes.json();
  const token = t.token;
  console.log('token',token.slice(0,10));
  const stats = await fetch(`${base}/api/analytics/admin`, { headers: { Authorization:`Bearer ${token}` } });
  console.log('admin stats', await stats.json());

  // doctor
  // optionally create a doctor user or use admin as doctor for test
  const stats2 = await fetch(`${base}/api/analytics/doctor`, { headers: { Authorization:`Bearer ${token}` } });
  console.log('doctor stats:', await stats2.json());
})();
