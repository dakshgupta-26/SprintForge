import { create } from 'zustand';
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  LocalParticipant,
  RemoteParticipant as LKRemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  ConnectionState,
  ConnectionQuality,
} from 'livekit-client';
import { getSocket, ensureSocketConnected } from '@/lib/socket';
import { callAPI } from '@/lib/api';
import {
  createLiveKitRoom,
  logCallEvent,
  mapConnectionQuality,
} from '@/lib/livekit';
import {
  SoundEffects,
  isWebRTCSupported,
  QualityMetrics,
  ConnectionQualityStatus,
} from '@/lib/webrtc';
import toast from 'react-hot-toast';

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed'
  | 'busy';

export interface RemoteParticipantProfile {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export type RemoteParticipant = RemoteParticipantProfile;

export interface LiveKitParticipantState {
  identity: string;
  name: string;
  avatar?: string;
  role?: string;
  audioTrack?: RemoteTrack | null;
  videoTrack?: RemoteTrack | null;
  screenTrack?: RemoteTrack | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  connectionQuality: ConnectionQualityStatus;
}

export interface IncomingCallData {
  callId: string;
  roomName?: string;
  projectId: string;
  projectName: string;
  projectKey?: string;
  caller: RemoteParticipantProfile;
  type: CallType;
  createdAt: string | Date;
}

export interface CallEndSummary {
  callId: string;
  remoteUser: RemoteParticipantProfile;
  duration: number; // in seconds
  type: CallType;
  endedAt: Date;
}

interface CallState {
  // Active call identifiers
  callId: string | null;
  roomName: string | null;
  projectId: string | null;
  projectName: string | null;
  callType: CallType;
  callStatus: CallStatus;
  statusText: string;
  isCaller: boolean;
  remoteUser: RemoteParticipantProfile | null;
  remoteParticipants: LiveKitParticipantState[];
  startedAt: Date | null;
  connectedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number;
  endSummary: CallEndSummary | null;

  // Local Media & Tracks
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
  preCallTargetMember: RemoteParticipantProfile | null;
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
    targetMember: RemoteParticipantProfile,
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
  joinLiveKitRoom: (callId: string) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  switchAudioInput: (deviceId: string) => Promise<void>;
  switchVideoInput: (deviceId: string) => Promise<void>;
  switchAudioOutput: (deviceId: string) => Promise<void>;
  clearEndSummary: () => void;
  dismissIncomingCallModal: () => void;
}

// ─── Module Singleton References ───────────────────────────────────────────
let activeLiveKitRoom: Room | null = null;
let durationInterval: NodeJS.Timeout | null = null;

export const useCallStore = create<CallState>((set, get) => ({
  callId: null,
  roomName: null,
  projectId: null,
  projectName: null,
  callType: 'video',
  callStatus: 'idle',
  statusText: '',
  isCaller: false,
  remoteUser: null,
  remoteParticipants: [],
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
    } catch (err) {
      console.warn('[CALL/DEVICES] Error enumerating devices:', err);
    }
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

  // ─── Global Socket.IO Signaling Listeners ────────────────────────────────
  initSocketListeners: (userId: string) => {
    if (get().isSocketInitialized) return;
    const socket = getSocket();
    if (!socket) return;

    set({ isSocketInitialized: true });
    get().fetchUnreadMissedCalls();
    get().enumerateDevices();

    // Listen for hardware device connections/disconnections
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        logCallEvent('DEVICE_CHANGED', { source: 'ondevicechange' });
        get().enumerateDevices();
      };
    }

    // 1. Incoming Call Event (received when another user calls)
    socket.on('call:incoming', (incomingData: IncomingCallData) => {
      console.log('[CALL] Received call:incoming event:', incomingData);
      // If user is caller, ignore
      if (incomingData.caller._id === userId) return;

      const currentStatus = get().callStatus;
      if (currentStatus !== 'idle' && currentStatus !== 'ended') {
        // User is currently in another call -> show conflict modal
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

    // 1b. Dismiss Incoming Call Event
    socket.on('call:dismiss_incoming', ({ callId }: { callId: string }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().incomingCall?.callId === callId) {
        set({ incomingCall: null, showConflictWarning: false });
      }
    });

    // 2. Caller receives "ringing" confirmation
    socket.on('call:ringing', ({ callId }) => {
      if (get().callId === callId && (get().callStatus === 'initiating' || get().callStatus === 'calling')) {
        set({
          callStatus: 'ringing',
          statusText: 'Ringing...',
        });
      }
    });

    // 3. Call Accepted by Receiver
    socket.on(
      'call:accepted',
      async (data: {
        callId: string;
        roomName?: string;
        callerId: string;
        receiverId: string;
        type: CallType;
      }) => {
        logCallEvent('CALL_ACCEPTED', { callId: data.callId, roomName: data.roomName });
        SoundEffects.stopIncomingRingtone();

        set({
          callStatus: 'connecting',
          statusText: 'Connecting to room...',
          incomingCall: null,
          showConflictWarning: false,
        });

        // Connect to LiveKit Room
        await get().joinLiveKitRoom(data.callId);
      }
    );

    // 4. Call Rejected / Declined
    const handleCallDeclined = ({ callId, reason }: { callId: string; reason?: string }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().callId === callId || get().incomingCall?.callId === callId) {
        toast.error(reason || 'Call was declined');
        cleanUpCallResources();
        set({
          callStatus: 'ended',
          statusText: reason || 'Call declined',
          incomingCall: null,
          showConflictWarning: false,
        });
      }
    };

    socket.on('call:rejected', handleCallDeclined);
    socket.on('call:declined', handleCallDeclined);

    // 5. Call Answered Elsewhere (multi-tab receiver)
    socket.on('call:answered-elsewhere', ({ callId }: { callId: string }) => {
      SoundEffects.stopIncomingRingtone();
      if (get().incomingCall?.callId === callId) {
        set({ incomingCall: null, showConflictWarning: false });
      }
    });

    // 6. Call Cancelled by Caller
    socket.on('call:cancelled', ({ callId, message }: { callId: string; message?: string }) => {
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
          statusText: message || 'Call cancelled',
        });
      }
    });

    // 7. Call Missed Notification
    socket.on('call:missed', ({ callId }: { callId: string }) => {
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

    // 8. Real-time Missed Call Unread Badge Update
    socket.on(
      'call:unread_update',
      ({ projectId, increment = 1 }: { projectId: string; increment?: number }) => {
        const counts = { ...get().missedCallsByProject };
        counts[projectId] = (counts[projectId] || 0) + increment;
        set({
          missedCallsByProject: counts,
          totalMissedCalls: get().totalMissedCalls + increment,
        });
      }
    );

    // 9. Call Ended
    socket.on(
      'call:ended',
      ({
        callId,
        duration,
      }: {
        callId: string;
        duration?: number;
        endedBy?: string;
      }) => {
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
      }
    );
  },

  // ─── Pre-Call Device Check Setup ─────────────────────────────────────────
  openPreCallCheck: async (targetMember, type, projectId, projectName) => {
    if (!isWebRTCSupported()) {
      toast.error(
        "Your browser doesn't support realtime audio/video. Please use Chrome, Edge, Safari, or Firefox."
      );
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
          toast.error('Microphone access is required for calls. Please check browser permissions.');
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
      toast.error('Realtime calling is not supported in this browser.');
      return;
    }

    const cleanTargetId =
      typeof targetUserId === 'object' && targetUserId !== null
        ? (targetUserId as any)._id
        : String(targetUserId);

    if (!cleanTargetId || !projectId) {
      toast.error('Invalid call destination.');
      return;
    }

    cleanUpCallResources();

    set({
      callStatus: 'initiating',
      statusText: 'Connecting to calling service...',
      isCaller: true,
      callType: type,
      projectId,
      startedAt: new Date(),
      durationSeconds: 0,
      endSummary: null,
      errorMessage: null,
    });

    logCallEvent('CALL_STARTED', { targetUserId: cleanTargetId, projectId, type });

    let socket: any = null;
    try {
      socket = await ensureSocketConnected(8000);
    } catch (sockErr: any) {
      console.error('[CALL] Failed to connect signaling socket:', sockErr);
      cleanUpCallResources();
      set({
        callStatus: 'failed',
        statusText: 'Signaling connection failed',
        errorMessage:
          'Unable to connect to the realtime calling server. Please check your internet connection.',
      });
      toast.error('Could not reach calling server. Please try again.');
      return;
    }

    try {
      // Clear any previous once listeners
      socket.off('call:initiated');
      socket.off('call:failed');
      socket.off('call:busy');

      let initiationTimer: NodeJS.Timeout | null = setTimeout(() => {
        if (get().callStatus === 'initiating') {
          console.warn('[CALL] Call initiation timed out without response from server.');
          socket.off('call:initiated');
          socket.off('call:failed');
          socket.off('call:busy');
          cleanUpCallResources();
          set({
            callStatus: 'failed',
            statusText: 'Connection timed out',
            errorMessage: 'Call request timed out. Please verify receiver is online and try again.',
          });
          toast.error('Call request timed out. No response from recipient.');
        }
      }, 15000);

      // Listen for initiate confirmation from server
      socket.once(
        'call:initiated',
        ({ callId, roomName }: { callId: string; roomName?: string }) => {
          if (initiationTimer) {
            clearTimeout(initiationTimer);
            initiationTimer = null;
          }
          logCallEvent('CALL_INVITE_SENT', { callId, roomName });
          set({
            callId,
            roomName: roomName || `sprintforge-call-${callId}`,
            callStatus: 'calling',
            statusText: 'Calling...',
          });
          SoundEffects.playCallingChime();
        }
      );

      // Listen for server failure responses
      socket.once('call:failed', ({ code, message }: { code?: string; message?: string }) => {
        if (initiationTimer) {
          clearTimeout(initiationTimer);
          initiationTimer = null;
        }

        cleanUpCallResources();

        if (code === 'USER_OFFLINE') {
          toast.error('User is currently offline.');
          set({
            callStatus: 'failed',
            statusText: 'User is offline',
            errorMessage:
              'Team member is currently offline. A missed call notification has been sent.',
          });
        } else if (code === 'NOT_AUTHORIZED') {
          toast.error('Calling is restricted to workspace members.');
          set({
            callStatus: 'failed',
            statusText: 'Not authorized',
            errorMessage: 'Workspace membership is required to place calls.',
          });
        } else {
          toast.error(message || 'Failed to start call');
          set({
            callStatus: 'failed',
            statusText: message || 'Call failed',
            errorMessage: message || 'Call initiation failed.',
          });
        }
      });

      // Listen for user busy response
      socket.once('call:busy', ({ message }: { message?: string }) => {
        if (initiationTimer) {
          clearTimeout(initiationTimer);
          initiationTimer = null;
        }
        toast(message || 'User is currently on another call.', { icon: '⏳' });
        cleanUpCallResources();
        set({
          callStatus: 'busy',
          statusText: 'User is busy on another call',
          errorMessage: 'User is currently on another active call.',
        });
      });

      socket.emit('call:initiate', {
        targetUserId: cleanTargetId,
        projectId,
        type,
      });
    } catch (err: any) {
      console.error('[CALL] Error initiating call:', err);
      cleanUpCallResources();
      set({
        callStatus: 'failed',
        statusText: 'Failed to initiate call',
        errorMessage: err.message || 'Call initiation failed.',
      });
      toast.error('Unable to place call.');
    }
  },

  // ─── Accept Incoming Call ────────────────────────────────────────────────
  acceptIncomingCall: async (callId: string) => {
    SoundEffects.stopIncomingRingtone();
    const incoming = get().incomingCall;
    if (!incoming || incoming.callId !== callId) return;

    if (get().callStatus === 'connected' || get().callStatus === 'calling') {
      await get().endActiveCall();
    }

    cleanUpCallResources();

    set({
      callId,
      roomName: incoming.roomName || `sprintforge-call-${callId}`,
      projectId: incoming.projectId,
      projectName: incoming.projectName,
      callType: incoming.type,
      callStatus: 'connecting',
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
      const socket = getSocket();
      socket.emit('call:accept', { callId });

      // Join LiveKit SFU Room
      await get().joinLiveKitRoom(callId);
    } catch (err: any) {
      console.error('Error accepting call:', err);
      cleanUpCallResources();
      set({
        callStatus: 'failed',
        statusText: 'Connection error',
        errorMessage: 'Failed to connect to call room.',
      });
      toast.error('Could not connect to call.');
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

    logCallEvent('CALL_ENDED', { callId, duration: currentDuration });

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

  // ─── Join LiveKit SFU Room ───────────────────────────────────────────────
  joinLiveKitRoom: async (callId: string) => {
    try {
      set({ statusText: 'Authorizing media session...' });
      logCallEvent('ROOM_CONNECTING', { callId });

      // Request authorized JWT token from backend
      const { data } = await callAPI.getCallToken(callId);

      if (!data || !data.token) {
        throw new Error('Failed to obtain participant access token');
      }

      const { token, url: serverLiveKitUrl, roomName } = data;
      const liveKitUrl =
        serverLiveKitUrl ||
        process.env.NEXT_PUBLIC_LIVEKIT_URL ||
        '';

      if (!liveKitUrl) {
        console.warn(
          '[CALL/LIVEKIT] No LIVEKIT_URL configured on backend or frontend.'
        );
      }

      // Initialize LiveKit Room instance
      const room = createLiveKitRoom();
      activeLiveKitRoom = room;

      // ── Room Events Setup ──

      // 1. Connection State Changes
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('[CALL/LIVEKIT] Connection state changed:', state);
        if (state === ConnectionState.Connected) {
          logCallEvent('ROOM_CONNECTED', { callId, roomName });
          SoundEffects.playCallConnectedSound();

          set({
            callStatus: 'connected',
            statusText: 'Connected',
            connectedAt: new Date(),
          });

          // Start duration timer
          if (!durationInterval) {
            durationInterval = setInterval(() => {
              set((s) => ({ durationSeconds: s.durationSeconds + 1 }));
            }, 1000);
          }
        } else if (state === ConnectionState.Reconnecting) {
          logCallEvent('ROOM_RECONNECTING', { callId });
          set({
            callStatus: 'reconnecting',
            statusText: 'Reconnecting...',
          });
        } else if (state === ConnectionState.Disconnected) {
          logCallEvent('ROOM_DISCONNECTED', { callId });
        }
      });

      // 2. Track Subscriptions (Remote Media Arrived)
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          publication: RemoteTrackPublication,
          participant: LKRemoteParticipant
        ) => {
          logCallEvent('REMOTE_TRACK_RECEIVED', {
            kind: track.kind,
            source: track.source,
            participant: participant.identity,
          });

          // Update remote participants state
          updateParticipantFromLiveKit(participant);

          // Maintain remoteStream for audio sink & legacy bindings
          const currentRemoteStream = get().remoteStream || new MediaStream();
          currentRemoteStream.addTrack(track.mediaStreamTrack);
          set({ remoteStream: currentRemoteStream });

          if (track.kind === Track.Kind.Audio) {
            set({ remoteIsMuted: false });
          } else if (track.kind === Track.Kind.Video) {
            if (track.source === Track.Source.ScreenShare) {
              set({ remoteIsScreenSharing: true });
            } else {
              set({ remoteIsVideoOff: false });
            }
          }
        }
      );

      // 3. Track Unsubscribed
      room.on(
        RoomEvent.TrackUnsubscribed,
        (
          track: RemoteTrack,
          publication: RemoteTrackPublication,
          participant: LKRemoteParticipant
        ) => {
          updateParticipantFromLiveKit(participant);

          if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
            set({ remoteIsScreenSharing: false });
          }
        }
      );

      // 4. Track Muted / Unmuted
      room.on(
        RoomEvent.TrackMuted,
        (publication, participant) => {
          updateParticipantFromLiveKit(participant as LKRemoteParticipant);
          if (publication.kind === Track.Kind.Audio) {
            set({ remoteIsMuted: true });
          } else if (publication.kind === Track.Kind.Video) {
            set({ remoteIsVideoOff: true });
          }
        }
      );

      room.on(
        RoomEvent.TrackUnmuted,
        (publication, participant) => {
          updateParticipantFromLiveKit(participant as LKRemoteParticipant);
          if (publication.kind === Track.Kind.Audio) {
            set({ remoteIsMuted: false });
          } else if (publication.kind === Track.Kind.Video) {
            set({ remoteIsVideoOff: false });
          }
        }
      );

      // 5. Active Speakers Changed
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        const localId = room.localParticipant.identity;
        const isLocalSpeaking = speakers.some((s) => s.identity === localId);
        const isRemoteSpeaking = speakers.some((s) => s.identity !== localId);

        set({
          isSpeaking: isLocalSpeaking,
          remoteIsSpeaking: isRemoteSpeaking,
        });

        // Update speaker flag for each participant in list
        const speakerIds = new Set(speakers.map((s) => s.identity));
        set((state) => ({
          remoteParticipants: state.remoteParticipants.map((p) => ({
            ...p,
            isSpeaking: speakerIds.has(p.identity),
          })),
        }));
      });

      // 6. Network Quality Changed
      room.on(
        RoomEvent.ConnectionQualityChanged,
        (quality: ConnectionQuality, participant: Participant) => {
          if (participant === room.localParticipant) {
            const mappedQuality = mapConnectionQuality(quality);
            set({
              qualityMetrics: {
                quality: mappedQuality,
                rttMs: quality === ConnectionQuality.Excellent ? 35 : quality === ConnectionQuality.Good ? 85 : 240,
                packetsLost: 0,
                packetsTotal: 100,
                packetLossPercent: quality === ConnectionQuality.Poor ? 6 : 0,
                bitrateKbps: quality === ConnectionQuality.Poor ? 250 : 1200,
              },
            });
          }
        }
      );

      // 7. Participant Connected & Disconnected
      room.on(RoomEvent.ParticipantConnected, (p: LKRemoteParticipant) => {
        updateParticipantFromLiveKit(p);
      });

      room.on(RoomEvent.ParticipantDisconnected, (p: LKRemoteParticipant) => {
        set((state) => ({
          remoteParticipants: state.remoteParticipants.filter((part) => part.identity !== p.identity),
        }));
      });

      // Connect room to LiveKit server
      set({ statusText: 'Connecting to media server...' });
      await room.connect(liveKitUrl, token);

      // Publish local audio (Microphone)
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        logCallEvent('LOCAL_AUDIO_PUBLISHED');
        set({ isMuted: false });
      } catch (micErr) {
        console.warn('[CALL/LIVEKIT] Microphone permission denied or unavailable:', micErr);
        toast.error('Microphone access is required for calls.');
      }

      // If video call, publish local camera
      if (get().callType === 'video') {
        try {
          await room.localParticipant.setCameraEnabled(true);
          logCallEvent('LOCAL_VIDEO_PUBLISHED');
          set({ isVideoOff: false });
        } catch (camErr) {
          console.warn('[CALL/LIVEKIT] Camera permission denied or unavailable:', camErr);
          toast('Camera unavailable. Call continuing with audio only.', { icon: '🎤' });
          set({ isVideoOff: true });
        }
      } else {
        set({ isVideoOff: true });
      }

      // Capture local MediaStream reference for local preview
      const localTracks = room.localParticipant.videoTrackPublications;
      const firstVidPub = Array.from(localTracks.values())[0];
      if (firstVidPub?.track) {
        const stream = new MediaStream([firstVidPub.track.mediaStreamTrack]);
        set({ localStream: stream });
      }
    } catch (err: any) {
      console.error('[CALL/LIVEKIT] Room join error:', err);
      cleanUpCallResources();

      if (err?.response?.data?.code === 'LIVEKIT_NOT_CONFIGURED') {
        set({
          callStatus: 'failed',
          statusText: 'Media server not configured',
          errorMessage:
            'LiveKit credentials are not configured on the backend. Please add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
        });
        toast.error(
          'LiveKit media server credentials missing on backend. Please configure environment variables.'
        );
      } else {
        set({
          callStatus: 'failed',
          statusText: 'Connection failed',
          errorMessage: err.message || 'Failed to establish media connection.',
        });
        toast.error('Could not connect to call room.');
      }
    }
  },

  // ─── In-Call Controls ────────────────────────────────────────────────────
  toggleMute: async () => {
    const room = activeLiveKitRoom;
    if (!room) return;

    const currentMuted = get().isMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(currentMuted);
      set({ isMuted: !currentMuted });
    } catch (err) {
      console.error('[CALL/LIVEKIT] Error toggling microphone:', err);
      toast.error('Unable to toggle microphone');
    }
  },

  toggleVideo: async () => {
    const room = activeLiveKitRoom;
    if (!room) return;

    const currentVideoOff = get().isVideoOff;
    try {
      await room.localParticipant.setCameraEnabled(currentVideoOff);
      set({ isVideoOff: !currentVideoOff });

      // Update local preview stream
      const localTracks = room.localParticipant.videoTrackPublications;
      const firstVidPub = Array.from(localTracks.values())[0];
      if (firstVidPub?.track && currentVideoOff) {
        const stream = new MediaStream([firstVidPub.track.mediaStreamTrack]);
        set({ localStream: stream });
      }
    } catch (err) {
      console.error('[CALL/LIVEKIT] Error toggling camera:', err);
      toast.error('Unable to toggle camera');
    }
  },

  startScreenShare: async () => {
    const room = activeLiveKitRoom;
    if (!room) return;

    try {
      await room.localParticipant.setScreenShareEnabled(true);
      set({ isScreenSharing: true });
      toast.success('Sharing your screen');
    } catch (err) {
      console.warn('[CALL/LIVEKIT] Screen share canceled or denied:', err);
    }
  },

  stopScreenShare: async () => {
    const room = activeLiveKitRoom;
    if (!room) return;

    try {
      await room.localParticipant.setScreenShareEnabled(false);
      set({ isScreenSharing: false, screenStream: null });
    } catch (err) {
      console.error('[CALL/LIVEKIT] Error stopping screen share:', err);
    }
  },

  // ─── Hardware Device Switchers ───────────────────────────────────────────
  switchAudioInput: async (deviceId: string) => {
    set({ selectedAudioInputId: deviceId });
    const room = activeLiveKitRoom;
    if (room) {
      try {
        await room.switchActiveDevice('audioinput', deviceId);
        toast.success('Microphone changed');
      } catch {
        toast.error('Failed to switch microphone');
      }
    }
  },

  switchVideoInput: async (deviceId: string) => {
    set({ selectedVideoInputId: deviceId });
    const room = activeLiveKitRoom;
    if (room) {
      try {
        await room.switchActiveDevice('videoinput', deviceId);
        toast.success('Camera changed');
      } catch {
        toast.error('Failed to switch camera');
      }
    }
  },

  switchAudioOutput: async (deviceId: string) => {
    set({ selectedAudioOutputId: deviceId });
    const room = activeLiveKitRoom;
    if (room && typeof (room as any).switchActiveDevice === 'function') {
      try {
        await (room as any).switchActiveDevice('audiooutput', deviceId);
      } catch {}
    }

    // Set sinkId on global audio sink element
    const globalAudioEl = document.getElementById('sprintforge-global-remote-audio') as any;
    if (globalAudioEl && typeof globalAudioEl.setSinkId === 'function') {
      try {
        await globalAudioEl.setSinkId(deviceId);
        toast.success('Speaker output changed');
      } catch {}
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

// ─── Helper: Update Participant State from LiveKit ─────────────────────────
function updateParticipantFromLiveKit(participant: LKRemoteParticipant) {
  let meta: any = {};
  try {
    if (participant.metadata) {
      meta = JSON.parse(participant.metadata);
    }
  } catch {}

  const audioPub = Array.from(participant.audioTrackPublications.values())[0];
  const videoPub = Array.from(participant.videoTrackPublications.values()).find(
    (p) => p.source !== Track.Source.ScreenShare
  );
  const screenPub = Array.from(participant.videoTrackPublications.values()).find(
    (p) => p.source === Track.Source.ScreenShare
  );

  const participantState: LiveKitParticipantState = {
    identity: participant.identity,
    name: participant.name || meta.name || 'Team Member',
    avatar: meta.avatar,
    role: meta.role || 'Member',
    audioTrack: (audioPub?.track as RemoteTrack) || null,
    videoTrack: (videoPub?.track as RemoteTrack) || null,
    screenTrack: (screenPub?.track as RemoteTrack) || null,
    isMuted: audioPub ? audioPub.isMuted : true,
    isVideoOff: videoPub ? videoPub.isMuted : true,
    isSpeaking: participant.isSpeaking,
    connectionQuality: mapConnectionQuality(participant.connectionQuality),
  };

  useCallStore.setState((state) => {
    const existingIndex = state.remoteParticipants.findIndex(
      (p) => p.identity === participant.identity
    );
    let updatedList: LiveKitParticipantState[];

    if (existingIndex >= 0) {
      updatedList = [...state.remoteParticipants];
      updatedList[existingIndex] = participantState;
    } else {
      updatedList = [...state.remoteParticipants, participantState];
    }

    // Also update remoteUser if matching
    const currentRemote = state.remoteUser;
    const isMainRemote = !currentRemote || currentRemote._id === participant.identity;

    return {
      remoteParticipants: updatedList,
      remoteUser: isMainRemote
        ? {
            _id: participant.identity,
            name: participant.name || meta.name || 'Team Member',
            avatar: meta.avatar,
            role: meta.role,
          }
        : currentRemote,
      remoteIsMuted: participantState.isMuted,
      remoteIsVideoOff: participantState.isVideoOff,
      remoteIsScreenSharing: Boolean(participantState.screenTrack),
    };
  });
}

// ─── Resource & Stream Cleanup ─────────────────────────────────────────────
function cleanUpCallResources() {
  SoundEffects.stopIncomingRingtone();

  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }

  // Disconnect LiveKit Room
  if (activeLiveKitRoom) {
    try {
      activeLiveKitRoom.disconnect();
    } catch {}
    activeLiveKitRoom = null;
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

  const screenStream = useCallStore.getState().screenStream;
  if (screenStream) {
    screenStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
  }

  useCallStore.setState({
    localStream: null,
    remoteStream: null,
    screenStream: null,
    remoteParticipants: [],
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
