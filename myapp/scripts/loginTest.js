import fetch from 'node-fetch';

(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@clinic.com', password: 'Doctor@123' })
    });
    const data = await res.json();
    console.log('Patient login response', data);
  } catch (err) {
    console.error('Error', err.message);
  }
})();