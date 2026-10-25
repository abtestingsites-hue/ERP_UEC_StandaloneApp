import axios from 'axios';

async function test() {
  const managerRes = await axios.post('http://127.0.0.1:4000/api/v1/auth/login', {
    email: 'leelavathi.manager@unisenth.local', password: 'password123'
  });
  const data = managerRes.data;
  console.log('User unitId:', data.user.unitId);
  const staffRes = await axios.get('http://127.0.0.1:4000/api/v1/medical/staff', {
    headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
  });
  console.log('Staff response body:', JSON.stringify(staffRes.data, null, 2));
}
test();
