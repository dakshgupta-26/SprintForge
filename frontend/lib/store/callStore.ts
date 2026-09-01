import { create } from 'zustand';
import { getSocket } from '@/lib/socket';
import { callAPI } from '@/lib/api';
import {
  getWebRTCConfig,
  getPeerConnectionQuality,
  QualityMetrics,
  ConnectionQualityStatus,
  SoundEffects,
  isWebRTCSupported,
} from '@/lib/webrtc';
import toast from 'react-hot-toast';

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed'
  | 'busy';

export interface RemoteParticipant {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface IncomingCallData {
  callId: string;
  projectId: string;
  projectName: string;
  projectKey?: string;
  caller: RemoteParticipant;
  type: CallType;
  createdAt: string | Date;
}

export interface CallEndSummary {
  callId: string;
  remoteUser: RemoteParticipant;
  duration: number; // in seconds
  type: CallType;
  endedAt: Date;
}

interface CallState {
  // Active call state
  callId: string | null;
  projectId: string | null;
  projectName: string | null;
  callType: CallType;
  callStatus: CallStatus;
  statusText: string;
  isCaller: boolean;
  remoteUser: RemoteParticipant | null;
  startedAt: Date | null;
  connectedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number;
  endSummary: CallEndSummary | null;

  // Media streams & tracks
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  remoteIsMuted: boolean;
  remoteIsVideoOff: boolean;
  remoteIsScreenSharing: boolean;
  isSpeaking: boolean;
  remoteIsSpeaking: boolean;

  // Hardware Devices
  selectedAudioInputId: string;
  selectedVideoInputId: string;
  selectedAudioOutputId: string;
  availableAudioInputs: MediaDeviceInfo[];
  availableVideoInputs: MediaDeviceInfo[];
  availableAudioOutputs: MediaDeviceInfo[];

  // Pre-call Device Check Modal
  preCallModalOpen: boolean;
  preCallTargetMember: RemoteParticipant | null;
  preCallType: CallType;
  preCallProjectId: string | null;
  preCallProjectName: string | null;
  preCallStream: MediaStream | null;
  preCallCamOpen: boolean;
  preCallMicOpen: boolean;

  // Global Incoming Call Overlay
  incomingCall: IncomingCallData | null;
  showConflictWarning: boolean;
  pendingAcceptCallId: string | null;

  // Missed calls badge counter
  missedCallsByProject: Record<string, number>;
  totalMissedCalls: number;

  // Network & Quality
  qualityMetrics: QualityMetrics | null;
  errorMessage: string | null;
  isSocketInitialized: boolean;

  // Actions
  initSocketListeners: (userId: string) => void;
  fetchUnreadMissedCalls: () => Promise<void>;
  markProjectCallsAsRead: (projectId: string) => Promise<void>;
  enumerateDevices: () => Promise<void>;
  openPreCallCheck: (
    targetMember: RemoteParticipant,
    type: CallType,
    projectId: string,
    projectName: string
  ) => Promise<void>;
  closePreCallCheck: () => void;
  togglePreCallCam: () => void;
  togglePreCallMic: () => void;
  startCallFromPreCheck: () => Promise<void>;
  initiateCall: (
    targetUserId: string,
    projectId: string,
    type?: CallType,
    existingStream?: MediaStream | null
  ) => Promise<void>;
  acceptIncomingCall: (callId: string) => Promise<void>;
  rejectIncomingCall: (callId: string, reason?: string) => Promise<void>;
  cancelCall: () => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  switchAudioInput: (deviceId: string) => Promise<void>;
  switchVideoInput: (deviceId: string) => Promise<void>;
  switchAudioOutput: (deviceId: string) => Promise<void>;
  clearEndSummary: () => void;
  dismissIncomingCallModal: () => void;
}

// ─── WebRTC Module References ──────────────────────────────────────────────
let peerConnection: RTCPeerConnection | null = null;
let durationInterval: NodeJS.Timeout | null = null;
let statsInterval: NodeJS.Timeout | null = null;
let queuedIceCandidates: RTCIceCandidateInit[] = [];

export const useCallStore = create<CallState>((set, get) => ({
  callId: null,
  projectId: null,
  projectName: null,
  callType: 'video',
  callStatus: 'idle',
  statusText: '',
  isCaller: false,
  remoteUser: null,
  startedAt: null,
  connectedAt: null,
  endedAt: null,
  durationSeconds: 0,
  endSummary: null,

  localStream: null,
  remoteStream: null,
  screenStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  remoteIsMuted: false,
  remoteIsVideoOff: false,
  remoteIsScreenSharing: false,
  isSpeaking: false,
  remoteIsSpeaking: false,

  selectedAudioInputId: 'default',
  selectedVideoInputId: 'default',
  selectedAudioOutputId: 'default',
  availableAudioInputs: [],
  availableVideoInputs: [],
  availableAudioOutputs: [],

  preCallModalOpen: false,
  preCallTargetMember: null,
  preCallType: 'video',
  preCallProjectId: null,
  preCallProjectName: null,
  preCallStream: null,
  preCallCamOpen: true,
  preCallMicOpen: true,

  incomingCall: null,
  showConflictWarning: false,
  pendingAcceptCallId: null,

  missedCallsByProject: {},
  totalMissedCalls: 0,

  qualityMetrics: null,
  errorMessage: null,
  isSocketInitialized: false,

  // ─── Device Enumeration ──────────────────────────────────────────────────
  enumerateDevices: async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

      set({
        availableAudioInputs: audioInputs,
        availableVideoInputs: videoInputs,
        availableAudioOutputs: audioOutputs,
      });
    } catch {}
  },

  // ─── Missed Calls Unread Counter API ─────────────────────────────────────
  fetchUnreadMissedCalls: async () => {
    try {
      const { data } = await callAPI.getUnreadMissedCalls();
      if (data) {
        set({
          totalMissedCalls: data.totalUnread || 0,
          missedCallsByProject: data.projects || {},
        });
      }
    } catch {}
  },

  markProjectCallsAsRead: async (projectId: string) => {
    if (!projectId) return;
    const currentCounts = { ...get().missedCallsByProject };
    const countToSubtract = currentCounts[projectId] || 0;
    delete currentCounts[projectId];

    set({
      missedCallsByProject: currentCounts,
      totalMissedCalls: Math.max(0, get().totalMissedCalls - countToSubtract),
    });

    try {
      await callAPI.markAllProjectCallsAsRead(projectId);
    } catch {
      get().fetchUnreadMissedCalls();
    }
  },

  // ─── Global Socket.IO Call Listeners ─────────────────────────────────────
  initSocketListeners: (userId: string) => {
    if (get().isSocketInitialized) return;
    const socket = getSocket();
    if (!socket) return;

    set({ isSocketInitialized: true });
    get().fetchUnreadMissedCalls();
    get().enumerateDevices();

    // 1. Incoming Call Event (receives when another user calls)
    socket.on('call:incoming', (incomingData: IncomingCallData) => {
      console.log('[CALL] Received call:incoming event:', incomingData);
      // If user is caller, ignore
      if (incomingData.caller._id === userId) return;

      const currentStatus = get().callStatus;
      if (currentStatus !== 'idle' && currentStatus !== 'ended') {
        // User is currently in another call -> show conflict modal or notify busy
        set({
          incomingCall: incomingData,
          showConflictWarning: true,
        });
      } else {
        set({
          incomingCall: incomingData,
          showConflictWarning: false,
        });
      }

      SoundEffects.startIncomingRingtone();
      socket.emit('call:ringing', { callId: incomingData.callId });
    });

    // 1b. Dismiss Incoming Call Event (e.g. call accepted/declined on another tab or cancelled)
    socket.on('call:dismiss_incoming', ({ callId }: { callId: string }) => {
      console.log('[CALL] Received call:dismiss_incoming event for callId:', callId);
      SoundEffects.stopIncomingRingtone();
      if (get().incomingCall?.callId === callId) {
        set({ incomingCall: null, showConflictWarning: false });
      }
    });

    // 2. Caller receives "ringing" confirmation
    socket.on('call:ringing', ({ callId }) => {
      console.log('[CALL] Received call:ringing event for callId:', callId);
      if (get().callId === callId && get().callStatus === 'initiating') {
        set({
          callStatus: 'ringing',
          statusText: 'Ringing...',
        });
      }
    });

    // 3. Call Accepted by Receiver
    socket.on('call:accepted', async (data: { callId: string; callerId: string; receiverId: string; type: CallType }) => {
      console.log('[CALL] Received call:accepted event:', data);
      SoundEffects.stopIncomingRingtone();
      SoundEffects.playCallConnectedSound();

      set({
        callStatus: 'connected',
        statusText: 'Connected',
        connectedAt: new Date(),
        incomingCall: null,
        showConflictWarning: false,
      });

      // If this user is the caller, initiate WebRTC Offer
      if (get().isCaller) {
        await createAndSendWebRTCOffer(data.callId);
      }
    });

    // 4. Remote WebRTC SDP Offer Received (Receiver side)
    socket.on('call:offer', async (data: { callId: string; sdp: RTCSessionDescriptionInit; senderId: string }) => {
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush any queued ICE candidates
        while (queuedIceCandidates.length > 0) {
          const candidate = queuedIceCandidates.shift();
          if (candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('call:answer', {
          callId: data.callId,
          sdp: peerConnection.localDescription,
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    // 5. Remote WebRTC SDP Answer Received (Caller side)
    socket.on('call:answer', async (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush queued ICE candidates
        while (queuedIceCandidates.length > 0) {
          const candidate = queuedIceCandidates.shift();
          if (candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    // 6. Remote ICE Candidate Received
    socket.on('call:ice-candidate', async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      if (!peerConnection || !peerConnection.remoteDescription) {
        queuedIceCandidates.push(data.candidate);
        return;
      }
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // 7. Track State Sync (Mute / Cam / Screen / Speaking)
    socket.on(
      'call:track-state',
      (data: { isMuted?: boolean; isVideoOff?: boolean; isScreenSharing?: boolean; isSpeaking?: boolean }) => {
        set((state) => ({
          remoteIsMuted: data.isMuted !== undefined ? data.isMuted : state.remoteIsMuted,
          remoteIsVideoOff: data.isVideoOff !== undefined ? data.isVideoOff : state.remoteIsVideoOff,
          remoteIsScreenSharing:
            data.isScreenSharing !== undefined ? data.isScreenSharing : state.remoteIsScreenSharing,
          remoteIsSpeaking: data.isSpeaking !== undefined ? data.isSpeaking : state.remoteIsSpeaking,
        }));
      }
    );

    // 8. Call Rejected / Declined
    socket.on('call:rejected', ({ callId, reason }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().callId === callId) {
        toast.error(reason || 'Call was declined');
        cleanUpCallResources();
        set({
          callStatus: 'ended',
          statusText: 'Call declined',
        });
      }
    });

    // 9. Call Cancelled by Caller
    socket.on('call:cancelled', ({ callId, message }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().incomingCall?.callId === callId) {
        toast(message || 'Call cancelled', { icon: '📞' });
        set({
          incomingCall: null,
          showConflictWarning: false,
        });
      }
      if (get().callId === callId) {
        cleanUpCallResources();
        set({
          callStatus: 'ended',
          statusText: 'Call cancelled',
        });
      }
    });

    // 10. Call Missed Notification
    socket.on('call:missed', ({ callId }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().incomingCall?.callId === callId) {
        set({ incomingCall: null, showConflictWarning: false });
      }
      if (get().callId === callId && get().callStatus !== 'connected') {
        cleanUpCallResources();
        set({
          callStatus: 'ended',
          statusText: 'Call missed (no answer)',
        });
      }
    });

    // 11. Real-time Missed Call Unread Badge Update
    socket.on('call:unread_update', ({ projectId, increment = 1 }) => {
      const counts = { ...get().missedCallsByProject };
      counts[projectId] = (counts[projectId] || 0) + increment;
      set({
        missedCallsByProject: counts,
        totalMissedCalls: get().totalMissedCalls + increment,
      });
    });

    // 12. Call Ended
    socket.on('call:ended', ({ callId, duration, endedBy }) => {
      SoundEffects.stopIncomingRingtone();
      SoundEffects.playCallEndedSound();

      const currentRemote = get().remoteUser;
      const currentType = get().callType;

      if (get().callId === callId || get().incomingCall?.callId === callId) {
        cleanUpCallResources();

        if (currentRemote) {
          set({
            endSummary: {
              callId,
              remoteUser: currentRemote,
              duration: duration || get().durationSeconds || 0,
              type: currentType,
              endedAt: new Date(),
            },
          });
        }

        set({
          callStatus: 'ended',
          statusText: 'Call ended',
          incomingCall: null,
          showConflictWarning: false,
        });
      }
    });
  },

  // ─── Pre-Call Device Check Setup ─────────────────────────────────────────
  openPreCallCheck: async (targetMember, type, projectId, projectName) => {
    if (!isWebRTCSupported()) {
      toast.error("Your browser doesn't support WebRTC calling. Please use Chrome, Edge, Safari, or Firefox.");
      return;
    }

    // Stop any existing preCallStream
    if (get().preCallStream) {
      get().preCallStream?.getTracks().forEach((t) => t.stop());
    }

    set({
      preCallModalOpen: true,
      preCallTargetMember: targetMember,
      preCallType: type,
      preCallProjectId: projectId,
      preCallProjectName: projectName,
      preCallCamOpen: type === 'video',
      preCallMicOpen: true,
      preCallStream: null,
    });

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video:
          type === 'video'
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              }
            : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ preCallStream: stream });
      get().enumerateDevices();
    } catch (err: any) {
      console.warn('Pre-call getUserMedia notice:', err);
      // If camera failed, fallback to audio only
      if (type === 'video') {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          set({ preCallStream: audioOnlyStream, preCallCamOpen: false });
          toast('Camera access unavailable. Continuing with audio only.', { icon: '🎤' });
        } catch {
          toast.error('Microphone and camera permissions are blocked. Please check your browser settings.');
        }
      }
    }
  },

  closePreCallCheck: () => {
    if (get().preCallStream) {
      get().preCallStream?.getTracks().forEach((t) => t.stop());
    }
    set({
      preCallModalOpen: false,
      preCallTargetMember: null,
      preCallStream: null,
    });
  },

  togglePreCallCam: () => {
    const stream = get().preCallStream;
    const currentCam = get().preCallCamOpen;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !currentCam;
      });
    }
    set({ preCallCamOpen: !currentCam });
  },

  togglePreCallMic: () => {
    const stream = get().preCallStream;
    const currentMic = get().preCallMicOpen;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !currentMic;
      });
    }
    set({ preCallMicOpen: !currentMic });
  },

  startCallFromPreCheck: async () => {
    const { preCallTargetMember, preCallProjectId, preCallType, preCallStream } = get();
    if (!preCallTargetMember || !preCallProjectId) return;

    const stream = preCallStream;
    set({ preCallModalOpen: false, preCallStream: null });

    await get().initiateCall(preCallTargetMember._id, preCallProjectId, preCallType, stream);
  },

  // ─── Initiate Outgoing Call ──────────────────────────────────────────────
  initiateCall: async (targetUserId, projectId, type = 'video', existingStream = null) => {
    if (!isWebRTCSupported()) {
      toast.error('WebRTC calling is not supported in this browser.');
      return;
    }

    const socket = getSocket();
    if (!socket?.connected) {
      socket.connect();
    }

    const cleanTargetId =
      typeof targetUserId === 'object' && targetUserId !== null
        ? (targetUserId as any)._id
        : String(targetUserId);

    // Clean up any stale calls
    cleanUpCallResources();

    set({
      callStatus: 'initiating',
      statusText: 'Connecting...',
      isCaller: true,
      callType: type,
      projectId,
      startedAt: new Date(),
      durationSeconds: 0,
      endSummary: null,
      errorMessage: null,
    });

    try {
      let localMediaStream = existingStream;
      if (!localMediaStream) {
        localMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video:
            type === 'video'
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: 'user',
                }
              : false,
        });
      }

      set({
        localStream: localMediaStream,
        isMuted: !localMediaStream.getAudioTracks()[0]?.enabled,
        isVideoOff: type === 'video' ? !localMediaStream.getVideoTracks()[0]?.enabled : true,
      });

      // Prepare WebRTC Peer Connection
      setupPeerConnection(localMediaStream);

      // Emit initiate to Socket server
      console.log(`[CALL] Emitting call:initiate to target ${cleanTargetId} in project ${projectId}`);
      socket.emit('call:initiate', {
        targetUserId: cleanTargetId,
        projectId,
        type,
      });

      // Clear any previous once listeners to avoid stale triggers
      socket.off('call:initiated');
      socket.off('call:failed');
      socket.off('call:busy');

      // Listen for initiate response
      socket.once('call:initiated', ({ callId }) => {
        console.log(`[CALL] Received call:initiated for callId: ${callId}`);
        set({
          callId,
          callStatus: 'calling',
          statusText: 'Calling...',
        });
        SoundEffects.playCallingChime();
      });

      socket.once('call:failed', ({ message }) => {
        toast.error(message || 'Failed to start call');
        cleanUpCallResources();
        set({
          callStatus: 'failed',
          statusText: message || 'Call failed',
          errorMessage: message,
        });
      });

      socket.once('call:busy', ({ message }) => {
        toast(message || 'User is currently on another call.', { icon: '⏳' });
        cleanUpCallResources();
        set({
          callStatus: 'busy',
          statusText: 'User is busy on another call',
        });
      });
    } catch (err: any) {
      console.error('Error initiating media stream:', err);
      cleanUpCallResources();
      set({
        callStatus: 'failed',
        statusText: 'Permission denied or media error',
        errorMessage: 'Microphone/camera access was denied or device is unavailable.',
      });
      toast.error('Unable to access microphone or camera.');
    }
  },

  // ─── Accept Incoming Call ────────────────────────────────────────────────
  acceptIncomingCall: async (callId: string) => {
    SoundEffects.stopIncomingRingtone();
    const incoming = get().incomingCall;
    if (!incoming || incoming.callId !== callId) return;

    // If currently on a call, end it cleanly first
    if (get().callStatus === 'connected' || get().callStatus === 'calling') {
      await get().endActiveCall();
    }

    cleanUpCallResources();

    set({
      callId,
      projectId: incoming.projectId,
      projectName: incoming.projectName,
      callType: incoming.type,
      callStatus: 'initiating',
      statusText: 'Connecting...',
      isCaller: false,
      remoteUser: incoming.caller,
      incomingCall: null,
      showConflictWarning: false,
      startedAt: new Date(),
      durationSeconds: 0,
      endSummary: null,
      errorMessage: null,
    });

    try {
      const localMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          incoming.type === 'video'
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              }
            : false,
      });

      set({
        localStream: localMediaStream,
        isMuted: false,
        isVideoOff: incoming.type === 'audio',
      });

      // Prepare WebRTC Peer Connection
      setupPeerConnection(localMediaStream);

      const socket = getSocket();
      socket.emit('call:accept', { callId });
    } catch (err: any) {
      console.error('Error accepting call media stream:', err);
      cleanUpCallResources();
      set({
        callStatus: 'failed',
        statusText: 'Camera/Mic error',
        errorMessage: 'Permission denied for microphone/camera.',
      });
      toast.error('Could not access microphone or camera to answer call.');
    }
  },

  // ─── Reject Incoming Call ────────────────────────────────────────────────
  rejectIncomingCall: async (callId: string, reason?: string) => {
    SoundEffects.stopIncomingRingtone();
    const socket = getSocket();
    socket.emit('call:reject', { callId, reason });

    set({
      incomingCall: null,
      showConflictWarning: false,
    });
  },

  // ─── Cancel Outgoing Call ────────────────────────────────────────────────
  cancelCall: async () => {
    const callId = get().callId;
    if (callId) {
      const socket = getSocket();
      socket.emit('call:cancel', { callId });
    }

    cleanUpCallResources();
    set({
      callStatus: 'ended',
      statusText: 'Call cancelled',
    });
  },

  // ─── End Active Call ─────────────────────────────────────────────────────
  endActiveCall: async () => {
    const callId = get().callId;
    const currentRemote = get().remoteUser;
    const currentDuration = get().durationSeconds;
    const currentType = get().callType;

    if (callId) {
      const socket = getSocket();
      socket.emit('call:end', { callId });
    }

    cleanUpCallResources();
    SoundEffects.playCallEndedSound();

    if (currentRemote) {
      set({
        endSummary: {
          callId: callId || 'ended',
          remoteUser: currentRemote,
          duration: currentDuration,
          type: currentType,
          endedAt: new Date(),
        },
      });
    }

    set({
      callStatus: 'ended',
      statusText: 'Call ended',
    });
  },

  // ─── In-Call Controls ────────────────────────────────────────────────────
  toggleMute: () => {
    const localStream = get().localStream;
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const newEnabledState = !audioTrack.enabled;
      audioTrack.enabled = newEnabledState;
      const isMuted = !newEnabledState;

      set({ isMuted });

      // Sync state to peer
      const socket = getSocket();
      if (get().callId) {
        socket.emit('call:track-state', {
          callId: get().callId,
          isMuted,
        });
      }
    }
  },

  toggleVideo: async () => {
    const localStream = get().localStream;
    const currentVideoOff = get().isVideoOff;

    if (!localStream) return;

    let videoTrack = localStream.getVideoTracks()[0];

    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      set({ isVideoOff: !nextState });

      // Sync state to peer
      const socket = getSocket();
      if (get().callId) {
        socket.emit('call:track-state', {
          callId: get().callId,
          isVideoOff: !nextState,
        });
      }
    } else if (currentVideoOff) {
      // If no video track exists initially (started as audio call), add video track dynamically
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);

        if (peerConnection) {
          peerConnection.addTrack(newVideoTrack, localStream);
          // Re-negotiate SDP if needed
          if (get().isCaller && get().callId) {
            await createAndSendWebRTCOffer(get().callId!);
          }
        }

        set({ isVideoOff: false, callType: 'video' });

        const socket = getSocket();
        if (get().callId) {
          socket.emit('call:track-state', {
            callId: get().callId,
            isVideoOff: false,
          });
        }
      } catch {
        toast.error('Unable to activate camera');
      }
    }
  },

  startScreenShare: async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      toast.error('Screen sharing is not supported in this browser.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenVideoTrack = displayStream.getVideoTracks()[0];

      // Handle user stopping screen share from browser banner
      screenVideoTrack.onended = () => {
        get().stopScreenShare();
      };

      // Replace current video track in RTCPeerConnection sender
      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        } else {
          peerConnection.addTrack(screenVideoTrack, displayStream);
        }
      }

      set({
        screenStream: displayStream,
        isScreenSharing: true,
      });

      const socket = getSocket();
      if (get().callId) {
        socket.emit('call:track-state', {
          callId: get().callId,
          isScreenSharing: true,
        });
      }

      toast.success('You are now sharing your screen');
    } catch (err) {
      console.warn('Screen share canceled or denied:', err);
    }
  },

  stopScreenShare: () => {
    const screenStream = get().screenStream;
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }

    // Restore camera video track in RTCPeerConnection sender
    const localStream = get().localStream;
    const cameraTrack = localStream?.getVideoTracks()[0] || null;

    if (peerConnection) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video' || s.track === null);
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    }

    set({
      screenStream: null,
      isScreenSharing: false,
    });

    const socket = getSocket();
    if (get().callId) {
      socket.emit('call:track-state', {
        callId: get().callId,
        isScreenSharing: false,
      });
    }
  },

  // ─── Hardware Device Switchers ───────────────────────────────────────────
  switchAudioInput: async (deviceId: string) => {
    set({ selectedAudioInputId: deviceId });
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newAudioTrack = newStream.getAudioTracks()[0];

      const localStream = get().localStream;
      if (localStream) {
        const oldAudioTrack = localStream.getAudioTracks()[0];
        if (oldAudioTrack) {
          localStream.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        localStream.addTrack(newAudioTrack);
      }

      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        if (audioSender) {
          audioSender.replaceTrack(newAudioTrack);
        }
      }
      toast.success('Microphone changed');
    } catch {
      toast.error('Failed to switch microphone');
    }
  },

  switchVideoInput: async (deviceId: string) => {
    set({ selectedVideoInputId: deviceId });
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      const localStream = get().localStream;
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(newVideoTrack);
      }

      if (peerConnection && !get().isScreenSharing) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      }
      toast.success('Camera changed');
    } catch {
      toast.error('Failed to switch camera');
    }
  },

  switchAudioOutput: async (deviceId: string) => {
    set({ selectedAudioOutputId: deviceId });
    // In browsers that support HTMLMediaElement.setSinkId
    const remoteAudioEl = document.getElementById('sprintforge-remote-audio') as any;
    if (remoteAudioEl && typeof remoteAudioEl.setSinkId === 'function') {
      try {
        await remoteAudioEl.setSinkId(deviceId);
        toast.success('Speaker output changed');
      } catch {
        toast.error('Failed to route audio to selected speaker');
      }
    }
  },

  clearEndSummary: () => {
    set({ endSummary: null });
  },

  dismissIncomingCallModal: () => {
    SoundEffects.stopIncomingRingtone();
    set({ incomingCall: null, showConflictWarning: false });
  },
}));

// ─── WebRTC PeerConnection Setup Helper ────────────────────────────────────
function setupPeerConnection(localStream: MediaStream) {
  const config = getWebRTCConfig();
  peerConnection = new RTCPeerConnection(config);
  queuedIceCandidates = [];

  // Add local stream tracks to RTCPeerConnection
  localStream.getTracks().forEach((track) => {
    if (peerConnection) {
      peerConnection.addTrack(track, localStream);
    }
  });

  // Handle incoming remote media tracks
  peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream) {
      useCallStore.setState({ remoteStream });
    } else {
      // Fallback if streams array is empty
      const current = useCallStore.getState().remoteStream || new MediaStream();
      current.addTrack(event.track);
      useCallStore.setState({ remoteStream: current });
    }
  };

  // Relay local ICE Candidates through Socket.IO
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      const callId = useCallStore.getState().callId;
      if (callId) {
        const socket = getSocket();
        socket.emit('call:ice-candidate', {
          callId,
          candidate: event.candidate.toJSON(),
        });
      }
    }
  };

  // Monitor connection states & handle reconnects/failures gracefully
  peerConnection.onconnectionstatechange = () => {
    if (!peerConnection) return;
    const state = peerConnection.connectionState;

    if (state === 'connected') {
      useCallStore.setState({
        callStatus: 'connected',
        statusText: 'Connected',
      });

      // Start duration timer
      if (!durationInterval) {
        durationInterval = setInterval(() => {
          useCallStore.setState((s) => ({ durationSeconds: s.durationSeconds + 1 }));
        }, 1000);
      }

      // Start WebRTC connection quality analyzer (polls every 3 seconds)
      if (!statsInterval) {
        statsInterval = setInterval(async () => {
          if (peerConnection) {
            const metrics = await getPeerConnectionQuality(peerConnection);
            useCallStore.setState({ qualityMetrics: metrics });
          }
        }, 3000);
      }
    } else if (state === 'disconnected') {
      useCallStore.setState({
        callStatus: 'reconnecting',
        statusText: 'Reconnecting...',
      });
    } else if (state === 'failed') {
      useCallStore.setState({
        callStatus: 'failed',
        statusText: 'Connection lost',
        errorMessage: 'Network connection between peers failed. Please try reconnecting.',
      });
    } else if (state === 'closed') {
      // closed
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    if (!peerConnection) return;
    const iceState = peerConnection.iceConnectionState;
    if (iceState === 'failed') {
      // Attempt ICE restart if caller
      if (useCallStore.getState().isCaller && useCallStore.getState().callId) {
        peerConnection.restartIce();
      }
    }
  };
}

// ─── Create & Send WebRTC SDP Offer (Caller) ──────────────────────────────
async function createAndSendWebRTCOffer(callId: string) {
  if (!peerConnection) return;
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);

    const socket = getSocket();
    socket.emit('call:offer', {
      callId,
      sdp: peerConnection.localDescription,
    });
  } catch (err) {
    console.error('Error creating WebRTC offer:', err);
  }
}

// ─── Full Resource & Stream Cleanup ────────────────────────────────────────
function cleanUpCallResources() {
  SoundEffects.stopIncomingRingtone();

  // Stop Duration Interval
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }

  // Stop Stats Interval
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  // Stop local media tracks
  const localStream = useCallStore.getState().localStream;
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
  }

  // Stop screen share tracks
  const screenStream = useCallStore.getState().screenStream;
  if (screenStream) {
    screenStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
  }

  // Close WebRTC RTCPeerConnection
  if (peerConnection) {
    try {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.close();
    } catch {}
    peerConnection = null;
  }

  queuedIceCandidates = [];

  useCallStore.setState({
    localStream: null,
    remoteStream: null,
    screenStream: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    remoteIsMuted: false,
    remoteIsVideoOff: false,
    remoteIsScreenSharing: false,
    isSpeaking: false,
    remoteIsSpeaking: false,
    qualityMetrics: null,
  });
}
