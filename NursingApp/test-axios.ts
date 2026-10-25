import axios from 'axios';

async function testFlow() {
  try {
    const res = await axios.post('https://erp-uec-backend.onrender.com/api/v1/auth/login', {
      email: 'leelavathi.manager@unisenth.local', password: 'password123'
    });
    const data = res.data;
    console.log('Manager Login Success');

    const staffRes = await axios.post('https://erp-uec-backend.onrender.com/api/v1/auth/login', {
      email: 'nursingcare@demo.com', password: 'password123'
    });
    const staffData = staffRes.data;
    console.log('Staff Login Success');

    const patientsRes = await axios.get('https://erp-uec-backend.onrender.com/api/v1/medical/patients', {
      headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
    });
    const patient = patientsRes.data[0];
    console.log('Patient selected:', patient.name);

    const assignRes = await axios.post('https://erp-uec-backend.onrender.com/api/v1/medical/assignments', {
      staffId: staffData.user.staffId,
      patientId: patient.id,
      dutyType: 'NURSING_CARE',
      role: 'Test Nurse',
      startAt: new Date().toISOString(),
      status: 'ASSIGNED',
      priority: 'CRITICAL'
    }, {
      headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
    });
    const assignData = assignRes.data;
    console.log('Assignment Created:', assignData.id);

    const shiftRes = await axios.get('https://erp-uec-backend.onrender.com/api/v1/medical/my-shift', {
      headers: { Authorization: `Bearer ${staffData.token}`, 'x-unit-id': staffData.user.unitId }
    });
    const shift = shiftRes.data;
    const found = shift.find(a => a.id === assignData.id);
    if (!found) throw new Error('Assignment not found in My Shift');
    console.log('Assignment verified in My Shift!');

    await axios.delete(`https://erp-uec-backend.onrender.com/api/v1/medical/assignments/${assignData.id}`, {
      headers: { Authorization: `Bearer ${data.token}`, 'x-unit-id': data.user.unitId }
    });
    console.log('Cleanup Success');
  } catch (e) {
    console.log('Error:', e.response ? e.response.data : e.message);
  }
}
testFlow();
