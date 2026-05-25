import * as FileSystem from 'expo-file-system/legacy';
import { supabase, SUPABASE_ANON_KEY } from './supabase';

const RENDERABLE_URI_PATTERN = /^(https?:\/\/|file:\/\/|content:\/\/|data:|ph:\/\/|assets-library:\/\/|blob:)/i;
const renderUriCache = new Map();

const isJsonLikeString = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const isSpecificImageCategory = (category) => (
  category === 'main' ||
  category === 'gallery' ||
  category === 'groom' ||
  category === 'bride'
);

export const unwrapImageValue = (value, depth = 0) => {
  if (!value || depth > 8) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isJsonLikeString(trimmed)) {
      try {
        return unwrapImageValue(JSON.parse(trimmed), depth + 1);
      } catch (error) {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map(item => unwrapImageValue(item, depth + 1));
  }

  if (typeof value !== 'object') return value;

  const image = { ...value };
  ['uri', 'publicUrl', 'url', 'originalUri'].forEach((key) => {
    if (typeof image[key] !== 'string') return;

    const nested = unwrapImageValue(image[key], depth + 1);
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const nestedUri = nested.uri || nested.publicUrl || nested.url || nested.originalUri;
      const currentValueIsJson = isJsonLikeString(image[key]);

      if (nestedUri && (key === 'uri' || currentValueIsJson)) image[key] = nestedUri;
      if (nestedUri && (!image.uri || isJsonLikeString(image.uri))) image.uri = nestedUri;
      if (nested.publicUrl && (!image.publicUrl || isJsonLikeString(image.publicUrl))) image.publicUrl = nested.publicUrl;
      if (nested.url && (!image.url || isJsonLikeString(image.url))) image.url = nested.url;
      if (nested.originalUri && (!image.originalUri || isJsonLikeString(image.originalUri))) image.originalUri = nested.originalUri;
      if (nested.storagePath && !image.storagePath) image.storagePath = nested.storagePath;
      if (nested.id && !image.id) image.id = nested.id;
      if (nested.categoryLabel && !image.categoryLabel) image.categoryLabel = nested.categoryLabel;
      if (isSpecificImageCategory(nested.category) && !isSpecificImageCategory(image.category)) {
        image.category = nested.category;
      }
    } else if (typeof nested === 'string') {
      image[key] = nested;
    }
  });

  return image;
};

const normalizeRenderableUri = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !RENDERABLE_URI_PATTERN.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\s/g, '%20');
  return trimmed;
};

const normalizeStoragePath = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isJsonLikeString(trimmed) || RENDERABLE_URI_PATTERN.test(trimmed)) return null;
  return trimmed
    .replace(/^\/+/, '')
    .replace(/^public\/event-images\//, '')
    .replace(/^event-images\//, '');
};

export const getEventImagePublicUrl = (storagePath) => {
  const path = normalizeStoragePath(storagePath);
  if (!path) return null;

  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(path);

  return normalizeRenderableUri(data?.publicUrl);
};

export const resolveImageUri = (image) => {
  const resolvedImage = unwrapImageValue(image);
  if (!resolvedImage) return null;

  if (typeof resolvedImage === 'string') {
    return normalizeRenderableUri(resolvedImage) || getEventImagePublicUrl(resolvedImage);
  }

  if (typeof resolvedImage !== 'object') return null;

  const freshLocalUri = resolvedImage.localOnly || resolvedImage.uploadSuccess
    ? normalizeRenderableUri(resolvedImage.uri)
    : null;

  return normalizeRenderableUri(resolvedImage.renderUri) ||
    freshLocalUri ||
    normalizeRenderableUri(resolvedImage.publicUrl) ||
    normalizeRenderableUri(resolvedImage.url) ||
    getEventImagePublicUrl(resolvedImage.storagePath) ||
    getEventImagePublicUrl(resolvedImage.publicUrl) ||
    getEventImagePublicUrl(resolvedImage.url) ||
    getEventImagePublicUrl(resolvedImage.uri) ||
    getEventImagePublicUrl(resolvedImage.originalUri) ||
    normalizeRenderableUri(resolvedImage.uri) ||
    normalizeRenderableUri(resolvedImage.originalUri);
};

export const resolveImageUriForRender = async (image) => {
  const uri = resolveImageUri(image);
  if (!uri || !/^https?:\/\//i.test(uri)) return uri;
  if (renderUriCache.has(uri)) return renderUriCache.get(uri);

  try {
    const extension = uri.split('?')[0].match(/\.(png|jpe?g|webp|heic)$/i)?.[1] || 'jpg';
    const fileName = `event_img_${Math.abs(hashString(uri))}.${extension}`;
    const localPath = `${FileSystem.cacheDirectory}${fileName}`;

    const existing = await FileSystem.getInfoAsync(localPath);
    if (existing.exists) {
      renderUriCache.set(uri, localPath);
      return localPath;
    }

    const result = await FileSystem.downloadAsync(uri, localPath, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });

    if (result.status >= 200 && result.status < 300 && result.uri) {
      renderUriCache.set(uri, result.uri);
      return result.uri;
    }
  } catch (error) {
    // Fall back to the original URL; the caller will still get a valid URI string.
  }

  return uri;
};

export const prepareImageForRender = async (image) => {
  const resolvedImage = unwrapImageValue(image);
  const publicUri = resolveImageUri(resolvedImage);
  const renderUri = await resolveImageUriForRender(resolvedImage);

  if (!resolvedImage || typeof resolvedImage !== 'object') {
    return renderUri ? { uri: renderUri, publicUrl: publicUri || renderUri, renderUri } : resolvedImage;
  }

  return {
    ...resolvedImage,
    uri: renderUri || resolvedImage.uri || publicUri || null,
    renderUri: renderUri || resolvedImage.renderUri || null,
    publicUrl: publicUri || resolvedImage.publicUrl || null,
  };
};

export const prepareImagesForRender = async (images = []) => (
  Promise.all(images.map(image => prepareImageForRender(image)))
);

export const toImageSource = (image) => {
  const uri = resolveImageUri(image);
  if (!uri) return null;
  if (/^https?:\/\/.*supabase\.co\/storage\/v1\/object/i.test(uri)) {
    return {
      uri,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    };
  }
  return { uri };
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};
