import Constants from 'expo-constants';

export const WEB_BASE_URL = 'https://jeongdamm.com';

export const getWebBaseUrl = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri || '';
    const devIp = hostUri.split(':')[0];
    if (devIp) return `http://${devIp}:3000`;
  }

  return WEB_BASE_URL;
};

const cleanPath = (path) => `/${String(path || '').replace(/^\/+/, '')}`;

export const getWebApiUrl = (path) => `${WEB_BASE_URL}${cleanPath(path)}`;

export const normalizePublicWebUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|[^/]+:\d+)\//i.test(url)) {
    const pathMatch = url.match(/^https?:\/\/[^/]+(\/.*)$/i);
    return pathMatch?.[1] ? `${WEB_BASE_URL}${pathMatch[1]}` : WEB_BASE_URL;
  }
  return url;
};

const getEventId = (eventOrId) =>
  typeof eventOrId === 'object'
    ? eventOrId?.id || eventOrId?.event_id
    : eventOrId;

const getPublicSlug = (eventOrId) =>
  typeof eventOrId === 'object'
    ? eventOrId?.public_slug || eventOrId?.publicSlug
    : null;

const getTemplateStyle = (eventOrId, fallbackTemplate = 'modern') =>
  typeof eventOrId === 'object'
    ? eventOrId?.template_style || eventOrId?.templateStyle || fallbackTemplate
    : fallbackTemplate;

export const getInvitationUrl = (eventOrId, fallbackTemplate = 'modern') => {
  const publicSlug = getPublicSlug(eventOrId);
  if (publicSlug) return `${getWebBaseUrl()}/w/${publicSlug}`;

  const eventId = getEventId(eventOrId);
  const templateStyle = getTemplateStyle(eventOrId, fallbackTemplate);
  return `${getWebBaseUrl()}/template/${eventId}?template=${templateStyle}`;
};

export const getPublicInvitationUrl = (eventOrId, fallbackTemplate = 'modern') => {
  const publicSlug = getPublicSlug(eventOrId);
  if (publicSlug) return `${WEB_BASE_URL}/w/${publicSlug}`;

  const eventId = getEventId(eventOrId);
  const templateStyle = getTemplateStyle(eventOrId, fallbackTemplate);
  return `${WEB_BASE_URL}/template/${eventId}?template=${templateStyle}`;
};

export const getContributionUrl = (eventOrId) => {
  const eventId = getEventId(eventOrId);
  return `${getWebBaseUrl()}/contribute/${eventId}`;
};
