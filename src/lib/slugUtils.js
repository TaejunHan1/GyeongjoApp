const HANGUL_BASE_CODE = 0xac00;
const HANGUL_LAST_CODE = 0xd7a3;
const HANGUL_MEDIAL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;

const INITIAL_ROMANIZATION = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const MEDIAL_ROMANIZATION = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

const FINAL_ROMANIZATION = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk',
  'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 'h',
];

const stripKoreanFamilyName = (name) => {
  const compactName = String(name || '').replace(/\s/g, '');
  return /^[가-힣]+$/.test(compactName) && compactName.length >= 3
    ? compactName.slice(1)
    : compactName;
};

const romanizeHangulSyllable = (char) => {
  const code = char.charCodeAt(0);

  if (code < HANGUL_BASE_CODE || code > HANGUL_LAST_CODE) {
    return char;
  }

  const syllableIndex = code - HANGUL_BASE_CODE;
  const initialIndex = Math.floor(syllableIndex / (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT));
  const medialIndex = Math.floor((syllableIndex % (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT)) / HANGUL_FINAL_COUNT);
  const finalIndex = syllableIndex % HANGUL_FINAL_COUNT;

  return [
    INITIAL_ROMANIZATION[initialIndex],
    MEDIAL_ROMANIZATION[medialIndex],
    FINAL_ROMANIZATION[finalIndex],
  ].join('');
};

export const romanizeKoreanName = (name) => {
  const givenName = stripKoreanFamilyName(name);
  return [...givenName]
    .map(romanizeHangulSyllable)
    .join('');
};

export const slugify = (value) => String(value || '')
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-');

export const buildEventSlugBase = ({
  eventType,
  groomName,
  brideName,
  mainPersonName,
  deceasedName,
  fallbackId,
}) => {
  if (eventType === 'wedding') {
    const groomSlug = slugify(romanizeKoreanName(groomName));
    const brideSlug = slugify(romanizeKoreanName(brideName));
    const coupleSlug = [groomSlug, brideSlug].filter(Boolean).join('-');
    if (coupleSlug) return coupleSlug;
  }

  const personSlug = slugify(romanizeKoreanName(deceasedName || mainPersonName));
  if (personSlug) return personSlug;

  return slugify(String(fallbackId || '').slice(0, 8)) || 'event';
};

export const buildSlugCandidate = (baseSlug, index) => (
  index <= 1 ? baseSlug : `${baseSlug}-${index}`
);
