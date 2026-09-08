import { AccessToken } from 'livekit-server-sdk';

export interface GenerateTokenOptions {
  roomName: string;
  identity: string;
  name: string;
  metadata?: Record<string, any>;
  ttl?: string | number;
}

/**
 * Validates whether required LiveKit environment variables are configured.
 */
export const isLiveKitConfigured = (): boolean => {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  return Boolean(url && apiKey && apiSecret);
};

/**
 * Returns the public LiveKit WebSocket/HTTP URL configured for media transport.
 */
export const getLiveKitUrl = (): string => {
  return process.env.LIVEKIT_URL?.trim() || '';
};

/**
 * Generates an authorized, cryptographically signed participant JWT token
 * for joining a dedicated LiveKit room.
 *
 * All API secrets remain strictly server-side.
 */
export const generateCallToken = async ({
  roomName,
  identity,
  name,
  metadata = {},
  ttl = '1h',
}: GenerateTokenOptions): Promise<string> => {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error(
      'LiveKit credentials missing. Please define LIVEKIT_API_KEY and LIVEKIT_API_SECRET in the server environment.'
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
    ttl,
  });

  // Participant capabilities & permissions
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
};
