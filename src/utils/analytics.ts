import { AnalyticsStat } from '@prisma/client';

export const FIXED_COUNTRIES = [
  'United States',
  'France',
  'Japan',
  'Thailand',
  'Taiwan',
  'Indonesia',
  'South Korea',
  'Philippines',
  'Singapore',
];

const FIXED_CHANNELS = ['direct', 'referral', 'organic'];
const FIXED_EVENTS = ['signup', 'login', 'view', 'click'];
const FIXED_GENDERS = ['male', 'female', 'other'];
const FIXED_LANGUAGES = ['us', 'fr', 'jp', 'th', 'tw', 'id', 'kr', 'ph', 'sg'];
const FIXED_PLATFORMS = ['mobile', 'web'];
const FIXED_OS = ['windows', 'macos', 'android', 'ios', 'ubuntu'];
const FIXED_BROWSERS = [
  'chrome',
  'firefox',
  'edge',
  'safari',
  'chrome-inapp',
  'safari-inapp',
];
const FIXED_DEVICES = ['desktop', 'mobile', 'tablet'];

type CountryMap = Record<string, number>;
type GenericMap = Record<string, number>;

export function mergeAnalyticsStats(stats: AnalyticsStat[]) {
  const summary = {
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    returningUsers: 0,
    sessions: 0,
    directSessions: 0,
    referralSessions: 0,
    avgEngagementTimeSec: 0,
    totalRevenue: 0,
    topCountries: {} as CountryMap,
    activeUsersByCountry: {} as CountryMap,
    eventSummary: {} as GenericMap,
    newUsersByChannel: {} as GenericMap,
    userGender: {} as GenericMap,
    userLanguage: {} as GenericMap,
    platformSummary: {} as GenericMap,
    osSummary: {} as GenericMap,
    browserSummary: {} as GenericMap,
    deviceCategory: {} as GenericMap,
  };

  const initAccumulator = (keys: string[]) => {
    const acc: GenericMap = {};
    keys.forEach((k) => (acc[k] = 0));
    return acc;
  };

  const countryAcc = initAccumulator(FIXED_COUNTRIES);
  const channelAcc = initAccumulator(FIXED_CHANNELS);
  const genderAcc = initAccumulator(FIXED_GENDERS);
  const langAcc = initAccumulator(FIXED_LANGUAGES);
  const eventAcc = initAccumulator(FIXED_EVENTS);
  const platformAcc = initAccumulator(FIXED_PLATFORMS);
  const osAcc = initAccumulator(FIXED_OS);
  const browserAcc = initAccumulator(FIXED_BROWSERS);
  const deviceAcc = initAccumulator(FIXED_DEVICES);

  let engagementSum = 0;

  for (const row of stats) {
    summary.totalUsers += row.totalUsers;
    summary.newUsers += row.newUsers;
    summary.activeUsers += row.activeUsers;
    summary.returningUsers += row.returningUsers;
    summary.sessions += row.sessions;
    summary.directSessions += row.directSessions;
    summary.referralSessions += row.referralSessions;
    summary.totalRevenue += row.totalRevenue;
    engagementSum += row.avgEngagementTimeSec;

    const addToAcc = (acc: GenericMap, data: GenericMap) => {
      for (const key in data) {
        if (acc[key] !== undefined) {
          acc[key] += data[key];
        }
      }
    };

    addToAcc(countryAcc, row.topCountries as GenericMap);
    addToAcc(eventAcc, row.eventSummary as GenericMap);
    addToAcc(channelAcc, row.newUsersByChannel as GenericMap);
    addToAcc(genderAcc, row.userGender as GenericMap);
    addToAcc(langAcc, row.userLanguage as GenericMap);
    addToAcc(platformAcc, row.platformSummary as GenericMap);
    addToAcc(osAcc, row.osSummary as GenericMap);
    addToAcc(browserAcc, row.browserSummary as GenericMap);
    addToAcc(deviceAcc, row.deviceCategory as GenericMap);
  }

  summary.topCountries = countryAcc;
  summary.activeUsersByCountry = countryAcc;
  summary.newUsersByChannel = channelAcc;
  summary.userGender = genderAcc;
  summary.eventSummary = eventAcc;
  summary.userLanguage = langAcc;
  summary.platformSummary = platformAcc;
  summary.osSummary = osAcc;
  summary.browserSummary = browserAcc;
  summary.deviceCategory = deviceAcc;
  summary.avgEngagementTimeSec = Math.floor(engagementSum / stats.length);

  return summary;
}
