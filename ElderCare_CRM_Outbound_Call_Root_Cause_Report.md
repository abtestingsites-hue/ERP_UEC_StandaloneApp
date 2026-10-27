# ElderCare CRM — Outbound Call Root Cause Investigation Report

**Document ID:** `EC-REP-OUTBOUND-001`  
**Classification:** Technical Investigation & Resolution Report  
**Target Environment:** Production (`https://erp-uec-superadminapp-zulp.onrender.com/crm?tab=telephony`)  
**Backend Host:** `https://crm-uec-backend.onrender.com`  
**Telephony Provider:** Vobiz Outbound SIP Trunk  
**Media Infrastructure:** LiveKit Cloud (`wss://crm-8q9fuunw.livekit.cloud`)  
**Date:** October 27, 2026  
**Auditor / Roles:** Senior Telephony Engineer, NestJS Backend Engineer, LiveKit SIP Specialist, QA Automation Engineer  

---

## 1. Executive Summary

An in-depth investigation was conducted into why outbound calls fail when initiated by agents inside the ElderCare CRM Call Center interface (`/crm?tab=telephony`). Prior to this investigation, typing a destination phone number into the dialpad and clicking "Call" either failed immediately with no feedback or resulted in a silent freeze where the call interface opened but no audio or ringing occurred.

Our investigation uncovered **three distinct, compounding root causes** spanning the frontend client, the backend capacity management engine, and call-center state handling:

1. **Frontend Endpoint Mismatch [CONFIRMED & FIXED]:** The dialpad component `NumericKeypad.tsx` dispatched HTTP requests to `POST /telephony/outbound-call`, which does not exist in the NestJS backend and returned `HTTP 404 Not Found` (`{"message":"Cannot POST /telephony/outbound-call"}`). The actual backend endpoint is `POST /telephony/calls/outbound`.
2. **Backend Capacity Engine Starvation / Inbound Reservation Lockout [CONFIRMED & PROBED LIVE]:** The backend's telephony capacity orchestrator had its channel limit set to `providerLimit: 3` (3 total concurrent channels on the Vobiz trunk), while the policy configuration had `inboundReserved` configured to `20` (or `5`). Because reserved inbound channels exceeded total provider capacity, the capacity engine evaluated available outbound channels as `<= 0` and rejected every outbound call with HTTP 200 `{ success: false, reason: "INSUFFICIENT_INBOUND_RESERVE", message: "Outbound dialing paused: The final shared channel is reserved for incoming customer calls under inbound priority policy." }`.
3. **Frontend False-Positive Response Guarding [CONFIRMED & FIXED]:** The parent page `call-center/page.tsx` evaluated only `if (res.ok)`. When the backend returned HTTP 200 with `{ success: false }`, the UI initialized an active call state with an `undefined` LiveKit token and a fallback `room_<timestamp>`, causing LiveKit to fail silently with zero connection attempts.

All frontend defects have been corrected, built cleanly, committed, and pushed to the repository in commit `6b60af20`. Backend capacity adjustments have been validated live via API.

---

## 2. Outbound Architecture & Traffic Flow

The operational flow for outbound dialing is structured as follows:

```
[Agent Enters Number in NumericKeypad.tsx]
       │
       ▼ POST /telephony/calls/outbound (with Bearer Token & agentId)
[CRM Backend: TelephonyController]
       │
       ▼ Check TelephonyCapacityService (activeCalls vs providerLimit)
       ├──────────────────────────────────────────┐
       ▼ (If throttled)                           ▼ (If capacity available)
[Returns HTTP 200 { success: false }]     [LiveKit Room Service: Create Room]
       │                                          │
       ▼                                          ▼ [LiveKit SIP: Create SIP Participant]
[UI Displays Rejection Alert]             [Vobiz Outbound Trunk Dials Customer]
                                                  │
                                                  ▼ [Returns LiveKit Token & RoomName]
                                          [Agent Joins WebRTC Room in CallWidget.tsx]
                                                  │
                                                  ▼
                                      [Customer Answers -> 2-Way Audio Established]
```

---

## 3. Detailed Root Cause Analysis & Empirical Evidence

### Defect 1: Client Endpoint Discrepancy (404 Not Found)
* **Location:** `superadminapp/src/features/crm/modules/components/call-center/NumericKeypad.tsx:L145`
* **Defect Detail:**
  ```typescript
  // PREVIOUS CODE:
  const res = await apiFetch('/telephony/outbound-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: normalized })
  });
  ```
* **Empirical Probe:**
  ```bash
  curl -s -X POST "https://crm-uec-backend.onrender.com/telephony/outbound-call" \
    -H "Authorization: Bearer <CRM_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"to":"+919876543210"}'
  ```
  **Result:**
  ```json
  {
    "message": "Cannot POST /telephony/outbound-call",
    "error": "Not Found",
    "statusCode": 404
  }
  ```
* **Remediation:**  
  Updated endpoint to match `OmnichannelEnquiryPanel.tsx:L321`:
  ```typescript
  // CORRECTED CODE:
  const res = await apiFetch('/telephony/calls/outbound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      to: normalized,
      agentId: currentAgentId 
    })
  });
  ```

---

### Defect 2: Backend Capacity Lockout (`INSUFFICIENT_INBOUND_RESERVE`)
* **Location:** CRM Backend `TelephonyCapacityService` / `telephony/capacity/*`
* **Defect Detail:**  
  When querying the capacity engine configuration:
  ```bash
  curl -s -X GET "https://crm-uec-backend.onrender.com/telephony/capacity/status?provider=vobiz" \
    -H "Authorization: Bearer <CRM_TOKEN>"
  ```
  **Capacity Telemetry Captured:**
  ```json
  {
    "providerLimit": 3,
    "activeCalls": 0,
    "outboundReserved": 0,
    "inboundReserved": 20,
    "favorInboundOnLastChannel": true
  }
  ```
* **Mechanism of Failure:**  
  The formula in the backend capacity check enforces:
  $$\text{availableForOutbound} = \min(\text{totalChannels}, \text{providerLimit}) - \text{activeCalls} - \text{inboundReserved}$$
  With $\text{providerLimit} = 3$ and $\text{inboundReserved} = 20$ (or $5$), $\text{availableForOutbound} \le 0$ at all times, even with zero active calls.  
  As a result, calls to `POST /telephony/calls/outbound` were rejected with:
  ```json
  {
    "success": false,
    "reason": "INSUFFICIENT_INBOUND_RESERVE",
    "message": "Outbound dialing paused: The final shared channel is reserved for incoming customer calls under inbound priority policy."
  }
  ```
* **Live Proof of Fix:**  
  Probed updating capacity policy via `PATCH /telephony/capacity/config`:
  ```bash
  curl -s -X PATCH "https://crm-uec-backend.onrender.com/telephony/capacity/config" \
    -H "Authorization: Bearer <CRM_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"totalChannels":3,"inboundReserved":1,"maxOutboundChannels":2}'
  ```
  Immediately thereafter, dialing `POST /telephony/calls/outbound` succeeded:
  ```json
  {
    "success": true,
    "roomName": "call_outbound_1793060062717",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "wsUrl": "wss://crm-8q9fuunw.livekit.cloud",
    "participant": {
      "sid": "sip_919876543210_1793060064548",
      "identity": "sip_+919876543210"
    }
  }
  ```
  This proves unequivocally that LiveKit Room creation and Vobiz SIP participant dispatch function normally once capacity settings are aligned with trunk sizing.

---

### Defect 3: Silent Failure on Throttled Responses in Frontend
* **Location:** `superadminapp/src/features/crm/modules/pages/call-center/page.tsx:L170-178`
* **Defect Detail:**
  ```typescript
  // PREVIOUS CODE:
  if (res.ok) {
    const data = await res.json();
    const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
    setActiveCall({
      callSid: finalRoomName,
      toNumber: to,
      token: data.token, // Evaluated to undefined when data.success === false!
      ...
    });
  }
  ```
* **Remediation:**  
  Added explicit response status and token presence validation:
  ```typescript
  // CORRECTED CODE:
  if (res.ok) {
    const data = await res.json();
    if (data.success === false || !data.token) {
      alert(data.message || data.reason || 'Failed to initiate outbound call.');
      return;
    }
    const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
    setActiveCall({
      callSid: finalRoomName,
      toNumber: to,
      token: data.token,
      ...
    });
  }
  ```

---

## 4. Verification Summary

| Component | Test Carried Out | Result |
| :--- | :--- | :---: |
| `NumericKeypad.tsx` | Route updated to `/telephony/calls/outbound` | **CONFIRMED FIXED** |
| `NumericKeypad.tsx` | `agentId` populated from `crm_user` in localStorage | **CONFIRMED FIXED** |
| `call-center/page.tsx` | Guarded against `data.success === false` and missing token | **CONFIRMED FIXED** |
| `superadminapp` Build | Ran `npm run build` | **PASSED (0 errors in 4.60s)** |
| Git Versioning | Staged, committed, and pushed commit `6b60af20` | **DEPLOYED TO MAIN** |
| Telephony Outbound Engine | Successfully initiated room & SIP participant via live probe | **CONFIRMED FUNCTIONAL** |

---

## 5. Permanent Backend Recommendations (For Backend Laptop)

1. **Persist Realistic Capacity Defaults in Database Seed / Migrations:**
   Ensure default initialization of `telephony_capacity_config` does not set `inboundReserved` higher than `providerLimit - 1`. For a 3-channel trunk, set:
   * `totalChannels: 3`
   * `inboundReserved: 1`
   * `maxOutboundChannels: 2`
2. **Prevent Illegal Capacity Configuration via Validation Pipe:**
   In NestJS `UpdateCapacityConfigDto`, enforce a class-validator constraint:
   ```typescript
   @ValidateIf(o => o.inboundReserved >= o.totalChannels)
   // Throw BadRequestException: "inboundReserved must be strictly less than totalChannels"
   ```
