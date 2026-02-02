/**
 * ICE Server Configuration for WebRTC
 * Provides STUN servers for NAT traversal
 * Optionally includes TURN servers for relay when direct connection fails
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  // Add TURN server if configured via environment variables
  // TURN servers provide relay for when direct P2P fails (corporate firewalls, etc.)
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
};

export const rtcConfiguration: RTCConfiguration = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
};
