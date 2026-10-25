import axios from 'axios';

async function test() {
  const managerRes = await axios.post('http://127.0.0.1:4000/api/v1/auth/login', {
    email: 'leelavathi.manager@unisenth.local', password: 'password123'
  });
  const data = managerRes.data;
  console.log('User unitId:', data.user.unitId);
  const patRes = await axios.get('http://127.0.0.1:4000/api/v1/patient', {
    headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
  });
  console.log('Patient endpoint (/patient) count:', patRes.data.data?.length);
  
  const medPatRes = await axios.get('http://127.0.0.1:4000/api/v1/medical/patients', {
    headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
  });
  console.log('Medical patients endpoint (/medical/patients) count:', medPatRes.data.data?.length);

  const admRes = await axios.get('http://127.0.0.1:4000/api/v1/enquiry/admissions', {
    headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
  });
  console.log('Admissions endpoint (/enquiry/admissions) count:', admRes.data.data?.length);
}
test();
