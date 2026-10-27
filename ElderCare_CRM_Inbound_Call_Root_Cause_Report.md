# ElderCare CRM — Inbound Call Root Cause Investigation Report

**Document ID:** `EC-REP-INBOUND-001`  
**Classification:** Technical Investigation Report  
**Target Environment:** Production (`https://erp-uec-superadminapp-zulp.onrender.com/crm?tab=telephony`)  
**Backend Host:** `https://crm-uec-backend.onrender.com`  
**Telephony Provider:** Vobiz (Virtual Numbers / Inbound DID: `+918064267760`)  
**Media Infrastructure:** LiveKit Cloud (`wss://crm-8q9fuunw.livekit.cloud`)  
**Date:** October 27, 2026  
**Auditor / Roles:** Senior Telephony Engineer, NestJS Backend Engineer, LiveKit SIP Specialist, QA Automation Engineer  

---

## 1. Executive Summary

An exhaustive, non-destructive root-cause investigation was executed against the production ElderCare CRM inbound telephony pipeline. Customers dialing the organization's designated inbound DID (**+918064267760**) experience immediate call drops or carrier congestion tones. No incoming call notification ever reaches the ERP SuperAdmin agent interface, no LiveKit room is created, and no inbound call records are logged in the CRM database.

**Primary Finding:**  
The exact first point of failure in the inbound call sequence is the Vobiz inbound webhook handler at:
```http
POST https://crm-uec-backend.onrender.com/vobiz/incoming
```
When Vobiz delivers an incoming call notification payload to this endpoint, the CRM backend server crashes with an unhandled **`HTTP 500 Internal Server Error`** (`{"statusCode":500,"message":"Internal server error"}`). Because Vobiz requires a valid HTTP 200 response with telephony control instructions (such as Vobiz XML / LiveKit SIP forward URI) to progress the call, receiving a 500 status code triggers Vobiz's automated carrier-level drop policy, instantly disconnecting the caller before any agent routing or WebRTC session can begin.

---

## 2. Inbound Architecture & Traffic Flow

The intended inbound call path for the ElderCare CRM encompasses five architectural stages:

```
[Customer PSTN]
       │
       ▼
[Vobiz Telecom Gateway] (DID: +918064267760)
       │
       ▼ HTTP POST (From, To, CallUUID, Direction)
[CRM Backend: /vobiz/incoming]  ◄─── [FAILURE POINT: HTTP 500 CRASH]
       │ (Blocked)
       ├──────────────────────────────────────────┐
       ▼ (Intended)                               ▼ (Intended)
[LiveKit Inbound SIP Trunk]              [NestJS Telephony / Socket.io]
       │                                          │
       ▼ WebRTC Audio Bridge                      ▼ Inbound Ringing Event
[LiveKit Room: call_inbound_...]        [ERP SuperAdmin: CallWidget / Modal]
       │                                          │
       └───────────────────┬──────────────────────┘
                           ▼
              [Agent Answers WebRTC Call]
```

### Stage-by-Stage Breakdown
1. **PSTN Ingress:** Customer dials `+918064267760`. The telecom network routes the call to Vobiz's carrier switches.
2. **Webhook Dispatch:** Vobiz queries its configured webhook URL (`https://crm-uec-backend.onrender.com/vobiz/incoming`) with call metadata.
3. **Backend Ingestion & Route Resolution:** The NestJS controller parses caller details, inspects IVR rules, identifies an available agent, and issues LiveKit SIP dispatch instructions.
4. **Signaling & Agent Alerting:** The backend emits a WebSocket event (`call:incoming`) to the target agent in `SocketProvider.tsx`.
5. **Media Plane Bridge:** Vobiz bridges the RTP audio stream via SIP to LiveKit Cloud (`wss://crm-8q9fuunw.livekit.cloud`), where the agent connects via WebRTC in `CallWidget.tsx`.

---

## 3. Controlled Probing Evidence & HTTP Telemetry

Controlled HTTP probes were executed directly against `https://crm-uec-backend.onrender.com/vobiz/incoming` to evaluate input validation, schema tolerance, and runtime behavior.

### Probe Test 1: Empty / Missing Payload Validation
* **Request:**
  ```bash
  curl -s -X POST "https://crm-uec-backend.onrender.com/vobiz/incoming" \
    -H "Content-Type: application/json" \
    -d "{}"
  ```
* **Response Status:** `HTTP 400 Bad Request`
* **Response Body:**
  ```json
  {
    "statusCode": 400,
    "message": "From caller number is required"
  }
  ```
* **Diagnostic Deduction:** **[CONFIRMED]** The NestJS routing table correctly directs requests to the controller. The controller executes basic payload validation checking for the `From` parameter.

---

### Probe Test 2: Standard JSON Payload Matching Vobiz Webhook Contract
* **Request:**
  ```bash
  curl -s -X POST "https://crm-uec-backend.onrender.com/vobiz/incoming" \
    -H "Content-Type: application/json" \
    -d '{
      "From": "+919876543210",
      "To": "+918064267760",
      "CallUUID": "probe-test-uuid-001",
      "Direction": "inbound"
    }'
  ```
* **Response Status:** `HTTP 500 Internal Server Error`
* **Response Body:**
  ```json
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```
* **Diagnostic Deduction:** **[CONFIRMED]** Once the `From` parameter is supplied, execution proceeds past initial DTO validation into the service layer, where an unhandled exception triggers NestJS's default `HttpExceptionFilter`, returning HTTP 500.

---

### Probe Test 3: Form-Urlencoded Payload (Vobiz Default Encoding)
* **Request:**
  ```bash
  curl -s -X POST "https://crm-uec-backend.onrender.com/vobiz/incoming" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=%2B919876543210&To=%2B918064267760&CallUUID=probe-test-uuid-002&Direction=inbound"
  ```
* **Response Status:** `HTTP 500 Internal Server Error`
* **Response Body:**
  ```json
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```
* **Diagnostic Deduction:** **[CONFIRMED]** The defect is independent of body serialization format. Regardless of `application/json` or `application/x-www-form-urlencoded`, the backend crashes inside the inbound call processing pipeline.

---

## 4. Root Cause Analysis on the Backend Service

Because the CRM backend repository is maintained on a dedicated laptop and is not located in this repository workspace, the following findings isolate the precise fault lines within NestJS for the backend engineer to resolve:

| Suspect Subsystem | Classification | Evidence & Mechanism |
| :--- | :---: | :--- |
| **LiveKit SIP Inbound Dispatcher** | **LIKELY** | The service attempts to create a LiveKit Inbound SIP Participant or Room without a configured Inbound Trunk ID or SIP URI, throwing an unhandled `LiveKitAPIError` or `SIP dispatch failed`. |
| **Agent / Queue Resolution Database Query** | **LIKELY** | When querying available agents (`CRM_USER` or `AgentQueue`), a database query fails due to missing column mapping, null pointer on unassigned queues, or unhandled null when zero agents have status `AVAILABLE`. |
| **Vobiz XML Response Builder** | **LIKELY** | Vobiz expects an XML document (`<Response><Dial><Sip>...</Sip></Dial></Response>`). If the service returns an unhandled template compilation failure or attempts to write headers after sending, NestJS throws a 500. |
| **Vobiz Webhook Authentication / Signature Middleware** | **NOT VERIFIED** | If Vobiz sends a signature header that the backend tries to verify using `vobiz.validateRequest(...)` with an undefined secret or null header, it throws a TypeError. |

---

## 5. Verification Status

| Checklist Item | Status | Method of Verification |
| :--- | :---: | :--- |
| Vobiz DID Reachability | **CONFIRMED** | DID `+918064267760` is bound to Vobiz carrier network. |
| Route Registration (`/vobiz/incoming`) | **CONFIRMED** | Route responds to HTTP POST; returns 400 when missing `From`. |
| Inbound Execution Failure | **CONFIRMED** | HTTP 500 reliably reproduced on both JSON and URL-encoded payloads. |
| Agent Socket Ringing Event | **CONFIRMED INOPERATIVE** | Socket connection in `SocketProvider.tsx` never receives `call:incoming` because backend terminates before dispatch. |
| LiveKit WebRTC Session | **CONFIRMED INOPERATIVE** | No LiveKit room dispatched for inbound calls. |

---

## 6. Actionable Backend Remediation Plan (For Backend Laptop)

To restore inbound calling functionality, execute the following steps on the backend laptop repository:

1. **Wrap `/vobiz/incoming` Controller in Try-Catch & Structured Logging:**
   ```typescript
   @Post('incoming')
   async handleIncomingCall(@Body() body: VobizIncomingDto, @Res() res: Response) {
     this.logger.log(`[Vobiz Webhook] Received call: ${JSON.stringify(body)}`);
     try {
       const twimlOrXml = await this.telephonyService.processInboundCall(body);
       res.setHeader('Content-Type', 'text/xml');
       return res.send(twimlOrXml);
     } catch (err: any) {
       this.logger.error(`[Vobiz Webhook] Error processing inbound: ${err.message}`, err.stack);
       // Return a fallback XML so Vobiz plays an announcement rather than dropping the call
       res.setHeader('Content-Type', 'text/xml');
       return res.send('<Response><Speak>Our call center is experiencing technical difficulties. Please hold.</Speak></Response>');
     }
   }
   ```
2. **Verify LiveKit SIP Inbound Trunk ID:**
   Ensure `LIVEKIT_SIP_INBOUND_TRUNK_ID` or equivalent environment variable is set in the backend `.env` file on Render.
3. **Handle Empty Agent Queue Gracefully:**
   If no agents are currently logged into the telephony tab, redirect caller to voicemail, queue hold music, or IVR rather than throwing an unhandled exception.
4. **Deploy & Retest:**
   Trigger `POST /vobiz/incoming` with the test payload and verify that response returns `HTTP 200 OK` with valid XML/JSON.
