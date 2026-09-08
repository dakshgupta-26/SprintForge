import {
  Room,
  RoomOptions,
  VideoPresets,
  AudioPresets,
  Track,
  RoomEvent,
  ConnectionQuality,
  ConnectionState,
} from 'livekit-client';

export type CallLogLevel = 'info' | 'warn' | 'error';

/**
 * Structured logger for call lifecycle events.
 * Never logs sensitive credentials, tokens, or private media data.
 */
export const logCallEvent = (
  eventName:
    | 'CALL_STARTED'
    | 'CALL_INVITE_SENT'
    | 'CALL_ACCEPTED'
    | 'ROOM_CONNECTING'
    | 'ROOM_CONNECTED'
    | 'LOCAL_AUDIO_PUBLISHED'
    | 'LOCAL_VIDEO_PUBLISHED'
    | 'REMOTE_TRACK_SUBSCRIBED'
    | 'REMOTE_TRACK_RECEIVED'
    | 'SCREENSHARE_STARTED'
    | 'SCREENSHARE_STOPPED'
    | 'MUTE_TOGGLED'
    | 'VIDEO_TOGGLED'
    | 'NETWORK_QUALITY_CHANGED'
    | 'RECONNECTING'
    | 'RECONNECTED'
    | 'DISCONNECTED'
    | 'ROOM_RECONNECTING'
    | 'ROOM_RECONNECTED'
    | 'ROOM_DISCONNECTED'
    | 'DEVICE_CHANGED'
    | 'CALL_FAILED'
    | 'CALL_ERROR'
    | 'CALL_ENDED',
  data?: Record<string, any>,
  level: CallLogLevel = 'info'
) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[SprintForge Call] [${timestamp}] [${eventName}]`;

  switch (level) {
    case 'error':
      console.error(logMessage, data ?? {});
      break;
    case 'warn':
      console.warn(logMessage, data ?? {});
      break;
    default:
      console.log(logMessage, data ?? {});
      break;
  }
};

/**
 * Default resilient configuration for LiveKit Rooms.
 */
export const createLiveKitRoom = (): Room => {
  const options: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
    publishDefaults: {
      simulcast: true,
      videoEncoding: VideoPresets.h720.encoding,
      audioPreset: AudioPresets.speech,
      dtx: true,
    },
  };

  return new Room(options);
};

export const mapConnectionQuality = (
  quality: ConnectionQuality
): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' => {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 'excellent';
    case ConnectionQuality.Good:
      return 'good';
    case ConnectionQuality.Poor:
      return 'poor';
    default:
      return 'fair';
  }
};
