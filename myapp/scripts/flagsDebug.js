import fetch from 'node-fetch';

(async () => {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@clinic.com', password: 'Doctor@123' })
  });
  const data = await res.json();
  console.log('login data', data);
  const flagsRes = await fetch('http://localhost:5000/api/subscriptions/flags', {
    headers: { Authorization: `Bearer ${data.token}` }
  });
  const flags = await flagsRes.json();
  console.log('flags', flags);
})();