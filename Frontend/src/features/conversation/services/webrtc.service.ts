import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../../store/authStore';

export class WebRTCService {
    private socket: Socket;
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback?: (stream: MediaStream) => void;
    private onCallEndedCallback?: () => void;
    private currentUserId: string;
    private targetUserId: string;

    constructor(currentUserId: string, targetUserId: string) {
        this.currentUserId = currentUserId;
        this.targetUserId = targetUserId;

        const socketUrl = (import.meta.env.VITE_SOCKET_URL || 'https://backend-erp-jp2x.onrender.com').replace(/\/$/, '');

        // Connect to the new /calls namespace
        this.socket = io(`${socketUrl}/calls`, {
            auth: { token: useAuthStore.getState().token },
            transports: ['websocket']
        });

        this.setupSocketListeners();
    }

    public onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    public onCallEnded(callback: () => void) {
        this.onCallEndedCallback = callback;
    }

    private setupSocketListeners() {
        this.socket.on("webrtc:offer", async (payload) => {
            if (payload.target === `agent:${this.currentUserId}`) {
                console.log("📥 Received WebRTC Offer in service listener");
            }
        });

        this.socket.on("webrtc:answer", async (payload) => {
            if (payload.target === `agent:${this.currentUserId}`) {
                console.log("📥 Received WebRTC Answer");
                if (this.peerConnection) {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                }
            }
        });

        this.socket.on("webrtc:ice-candidate", async (payload) => {
            if (payload.target === `agent:${this.currentUserId}`) {
                if (this.peerConnection) {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
            }
        });

        this.socket.on("webrtc:end", () => {
            this.endCall(false);
        });
    }

    private createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit("webrtc:ice-candidate", {
                    target: `agent:${this.targetUserId}`,
                    candidate: event.candidate
                });
            }
        };

        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(this.remoteStream);
            }
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }
    }

    public async startCall() {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.createPeerConnection();

        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        this.socket.emit("webrtc:offer", {
            target: `agent:${this.targetUserId}`,
            sdp: offer
        });

        return this.localStream;
    }

    public async answerCall(payload: any) {
        this.targetUserId = payload?.callerUserId || payload?.caller?.replace('agent:', '') || this.targetUserId;
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.createPeerConnection();

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        this.socket.emit("webrtc:answer", {
            target: `agent:${this.targetUserId}`,
            sdp: answer
        });

        return this.localStream;
    }

    public endCall(emitEvent = true) {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (emitEvent) {
            this.socket.emit("webrtc:end", { target: `agent:${this.targetUserId}` });
        }

        if (this.onCallEndedCallback) {
            this.onCallEndedCallback();
        }
    }

    public destroy() {
        this.endCall(false);
        this.socket.disconnect();
    }
}
