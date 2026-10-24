const axios = require('axios');

async function run() {
    try {
        const loginRes = await axios.post('https://erp-uec-backend.onrender.com/api/v1/auth/login', {
            identifier: 'Palanivel@gmail.com',
            password: 'Password@123'
        });

        const token = loginRes.data.data.token;
        console.log('Login successful');

        const api = axios.create({
            baseURL: 'https://erp-uec-backend.onrender.com/api/v1',
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Testing /profile/me...');
        try {
            const prof = await api.get('/profile/me');
            console.log('Profile:', prof.data.data.name);
        } catch (e) {
            console.error('Profile Error:', e.response?.data || e.message);
        }

        console.log('Testing Leave Submit...');
        try {
            const leave = await api.post('/hr/my-leave-requests', {
                leaveType: 'Casual Leave',
                fromDate: '2026-10-10',
                toDate: '2026-10-11',
                reason: 'Test'
            });
            console.log('Leave Submitted:', leave.data?.data?.id);
        } catch (e) {
            console.error('Leave Error:', e.response?.data || e.message);
        }

        console.log('Testing Attendance Check-In...');
        try {
            const att = await api.post('/hr/my-attendance', {
                action: 'CHECK_IN',
                note: 'Test'
            });
            console.log('Attendance Submitted:', att.data?.data?.id);
        } catch (e) {
            console.error('Attendance Error:', e.response?.data || e.message);
        }

    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
    }
}

run();
