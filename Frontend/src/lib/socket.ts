import { io } from "socket.io-client";

const resolveSocketUrl = () => {
    const configuredUrl = import.meta.env.VITE_SOCKET_URL || "https://erp-uec-backend.onrender.com"

    if (typeof window === "undefined") {
        return configuredUrl;
    }

    try {
        const socketUrl = new URL(configuredUrl, window.location.origin);
        const appUrl = new URL(window.location.origin);

        if (socketUrl.port === "3000" && appUrl.port === "3000") {
            socketUrl.port = "4000";
        }

        return socketUrl.toString().replace(/\/$/, "");
    } catch {
        return configuredUrl;
    }
};

const SOCKET_URL = resolveSocketUrl();

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true
});

socket.on("connect", () => {
    console.log("🔌 Connected to Automation WebSocket");
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from Automation WebSocket");
});
