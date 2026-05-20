import crypto from 'crypto';

export const DEFAULT_PLAY_DOMAIN = 'vod.minchapseries.com';

function getCdnSigningKey() {
  return (
    process.env.BYTEPLUS_CDN_AUTH_KEY ||
    process.env.BYTEPLUS_URL_SIGNING_PRIMARY_KEY ||
    process.env.BYTEPLUS_URL_SIGNING_KEY ||
    ''
  ).trim();
}

function getCdnSigningParameterName() {
  return (process.env.BYTEPLUS_CDN_AUTH_PARAM || 'auth_key').trim();
}

function getCdnSigningRand() {
  return (
    process.env.BYTEPLUS_CDN_AUTH_RAND ||
    crypto.randomBytes(16).toString('hex')
  ).trim();
}

function getCdnSigningUid() {
  return (process.env.BYTEPLUS_CDN_AUTH_UID || '0').trim();
}

export function signCdnUrl(playbackUrl) {
  const signingKey = getCdnSigningKey();

  if (!playbackUrl || !signingKey) return playbackUrl;

  const signedUrl =
    playbackUrl instanceof URL ? new URL(playbackUrl.href) : new URL(playbackUrl);
  const signingParameterName = getCdnSigningParameterName();
  const timestamp = Math.floor(Date.now() / 1000);
  const rand = getCdnSigningRand();
  const uid = getCdnSigningUid();

  const token = crypto
    .createHash('md5')
    .update(`${signedUrl.pathname}-${timestamp}-${rand}-${uid}-${signingKey}`)
    .digest('hex');

  signedUrl.searchParams.delete(signingParameterName);
  signedUrl.searchParams.set(
    signingParameterName,
    `${timestamp}-${rand}-${uid}-${token}`
  );

  return playbackUrl instanceof URL ? signedUrl : signedUrl.href;
}

export function shouldUseHlsProxy() {
  return (
    String(
      process.env.BYTEPLUS_USE_HLS_PROXY ||
        process.env.NEXT_PUBLIC_USE_HLS_PROXY ||
        'false'
    ).toLowerCase() !== 'false'
  );
}
