import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const resolveSocketUrl = () => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
    if (explicitSocketUrl) return normalizeBackendOrigin(explicitSocketUrl);

    const apiUrl = import.meta.env.VITE_API_URL?.trim();
    if (apiUrl) {
        try {
            return normalizeBackendOrigin(new URL(apiUrl, window.location.origin).origin);
        } catch {
            return window.location.origin;
        }
    }

    return window.location.origin;
};

const normalizeBackendOrigin = (url: string) => {
    if (typeof window === "undefined") return url;

    try {
        const backendUrl = new URL(url, window.location.origin);
        const appUrl = new URL(window.location.origin);

        if (backendUrl.port === "3000" && appUrl.port === "3000") {
            backendUrl.port = "4000";
        }

        return backendUrl.toString().replace(/\/$/, "");
    } catch {
        return url;
    }
};

const SOCKET_URL = resolveSocketUrl();

const resolveSocketAuth = () => {
    const { token, activeUnitId, user } = useAuthStore.getState();

    return {
        token: token || undefined,
        unitId: activeUnitId || user?.unitId || undefined
    };
};

export const realtimeSocket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: resolveSocketAuth()
});

export const callsSocket = io(`${SOCKET_URL}/calls`, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: resolveSocketAuth()
});

let lastSocketAuthKey = "";

export const connectRealtimeSocket = () => {
    const auth = resolveSocketAuth();
    const authKey = `${auth.token || ""}:${auth.unitId || ""}`;
    const authChanged = authKey !== lastSocketAuthKey;

    realtimeSocket.auth = auth;
    lastSocketAuthKey = authKey;

    if (authChanged && realtimeSocket.connected) {
        realtimeSocket.disconnect();
    }

    if (!realtimeSocket.connected) {
        realtimeSocket.connect();
    }

    return realtimeSocket;
};

export const connectCallsSocket = () => {
    const auth = resolveSocketAuth();
    callsSocket.auth = auth;

    if (!callsSocket.connected) {
        callsSocket.connect();
    }

    return callsSocket;
};
