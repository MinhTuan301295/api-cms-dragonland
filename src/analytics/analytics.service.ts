import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays, parseISO, isValid } from 'date-fns';
import { differenceInCalendarDays } from 'date-fns';
import { AnalyticsStat } from '@prisma/client';

const FIXED_COUNTRIES = [
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
const FIXED_PLATFORMS = ['mobile', 'website'];
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

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getValidRetentionDate(fromDate: Date, toDate: Date): string {
    const MIN_DATE = new Date('2025-05-01');
    const today = new Date();
    if (fromDate < MIN_DATE) {
      return '2025-05-01';
    }

    if (differenceInCalendarDays(toDate, fromDate) >= 49) {
      return fromDate.toISOString().split('T')[0];
    }

    const fallbackDate = new Date(today);
    fallbackDate.setDate(fallbackDate.getDate() - 50);
    return fallbackDate.toISOString().split('T')[0];
  }

  async getSummary(from?: string, to?: string) {
    const today = new Date();
    const rawFrom = from ? parseISO(from) : subDays(today, 30);
    const rawTo = to ? parseISO(to) : today;
    const fromDate = isValid(rawFrom) ? rawFrom : subDays(today, 30);
    const toDate = isValid(rawTo) ? rawTo : today;
    const toDatePlus1 = new Date(toDate);
    toDatePlus1.setDate(toDate.getDate() + 1);

    const records: AnalyticsStat[] = await this.prisma.analyticsStat.findMany({
      where: {
        date: {
          gte: fromDate,
          lt: toDatePlus1,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (records.length === 0) {
      return {
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        returningUsers: 0,
        sessions: 0,
        directSessions: 0,
        referralSessions: 0,
        avgEngagementTimeSec: 0,
        totalRevenue: 0,
        chartData: [],
        topCountries: FIXED_COUNTRIES.map((country) => ({ country, count: 0 })),
        activeUsersByCountry: FIXED_COUNTRIES.map((country) => ({
          country,
          count: 0,
        })),
        sessionSources: [],
        newUsersByChannel: FIXED_CHANNELS.map((channel) => ({
          channel,
          count: 0,
        })),
        eventSummary: FIXED_EVENTS.map((event) => ({ event, count: 0 })),
        userGender: FIXED_GENDERS.map((gender) => ({ gender, count: 0 })),
        userLanguage: FIXED_LANGUAGES.map((language) => ({
          language,
          count: 0,
        })),
        platformSummary: FIXED_PLATFORMS.map((platform) => ({
          platform,
          count: 0,
        })),
        osSummary: FIXED_OS.map((OSplatform) => ({ OSplatform, count: 0 })),
        browserSummary: FIXED_BROWSERS.map((browsers) => ({
          browsers,
          count: 0,
        })),
        deviceCategory: FIXED_DEVICES.map((devices) => ({ devices, count: 0 })),
        userActivityOverTime: Array.from({ length: 24 }).map((_, i) => ({
          hour: i.toString().padStart(2, '0'),
          count: 0,
        })),
        userRetention: [],
      };
    }

    let engagementSum = 0;
    const summary = {
      totalUsers: 0,
      newUsers: 0,
      activeUsers: 0,
      returningUsers: 0,
      sessions: 0,
      directSessions: 0,
      referralSessions: 0,
      totalRevenue: 0,
    };

    const initMap = (keys: string[]) =>
      Object.fromEntries(keys.map((k) => [k, 0]));

    const countryMap = initMap(FIXED_COUNTRIES);
    const activeCountryMap = initMap(FIXED_COUNTRIES);
    const channelMap = initMap(FIXED_CHANNELS);
    const eventMap = initMap(FIXED_EVENTS);
    const genderMap = initMap(FIXED_GENDERS);
    const languageMap = initMap(FIXED_LANGUAGES);
    const platformMap = initMap(FIXED_PLATFORMS);
    const osMap = initMap(FIXED_OS);
    const browserMap = initMap(FIXED_BROWSERS);
    const deviceMap = initMap(FIXED_DEVICES);
    const hourMap = Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [i.toString().padStart(2, '0'), 0]),
    );

    for (const r of records) {
      summary.totalUsers += r.totalUsers;
      summary.newUsers += r.newUsers;
      summary.activeUsers += r.activeUsers;
      summary.returningUsers += r.returningUsers;
      summary.sessions += r.sessions;
      summary.directSessions += r.directSessions;
      summary.referralSessions += r.referralSessions;
      summary.totalRevenue += r.totalRevenue;
      engagementSum += r.avgEngagementTimeSec;

      const accumulate = (
        arr: any[],
        map: Record<string, number>,
        key: string,
        valueKey = 'count',
      ) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          const k = item[key];
          if (map[k] !== undefined) {
            map[k] += item[valueKey] || 0;
          }
        }
      };

      accumulate(r.topCountries as any[], countryMap, 'country', 'count');
      accumulate(
        r.activeUsersByCountry as any[],
        activeCountryMap,
        'country',
        'count',
      );
      accumulate(r.newUsersByChannel as any[], channelMap, 'channel', 'count');
      accumulate(r.eventSummary as any[], eventMap, 'event', 'count');
      accumulate(r.userGender as any[], genderMap, 'gender', 'count');
      accumulate(r.userLanguage as any[], languageMap, 'language', 'count');
      accumulate(r.platformSummary as any[], platformMap, 'platform', 'count');
      accumulate(r.osSummary as any[], osMap, 'OSplatform', 'count');
      accumulate(r.browserSummary as any[], browserMap, 'browsers', 'count');
      accumulate(r.deviceCategory as any[], deviceMap, 'devices', 'count');

      if (Array.isArray(r.userActivityOverTime)) {
        for (const h of r.userActivityOverTime as any[]) {
          const hour = h.hour?.toString().padStart(2, '0');
          if (hourMap[hour] !== undefined) {
            hourMap[hour] += h.count || 0;
          }
        }
      }
    }

    const avgEngagementTimeSec = Math.round(engagementSum / records.length);
    const topCountries = FIXED_COUNTRIES.map((country) => ({
      country,
      count: countryMap[country],
    }));
    const activeUsersByCountry = FIXED_COUNTRIES.map((country) => ({
      country,
      count: activeCountryMap[country],
    }));

    const validRetentionDate = this.getValidRetentionDate(fromDate, toDate);
    const retentionRecord = records.find(
      (r) => r.date.toISOString().split('T')[0] === validRetentionDate,
    );
    const userRetention = retentionRecord?.userRetention ?? [];

    return {
      ...summary,
      avgEngagementTimeSec,
      chartData: records.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        newUsers: r.newUsers,
        activeUsers: r.activeUsers,
        sessions: r.sessions,
      })),
      engagementChartData: records.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        avgEngagementTimeSec: r.avgEngagementTimeSec,
      })),
      topCountries,
      activeUsersByCountry,
      sessionSources: [
        { type: 'direct', count: summary.directSessions },
        { type: 'referral', count: summary.referralSessions },
      ],
      newUsersByChannel: FIXED_CHANNELS.map((c) => ({
        channel: c,
        count: channelMap[c],
      })),
      eventSummary: FIXED_EVENTS.map((e) => ({ event: e, count: eventMap[e] })),
      userGender: FIXED_GENDERS.map((g) => ({
        gender: g,
        count: genderMap[g],
      })),
      userLanguage: FIXED_LANGUAGES.map((l) => ({
        language: l,
        count: languageMap[l],
      })),
      platformSummary: FIXED_PLATFORMS.map((p) => ({
        platform: p,
        count: platformMap[p],
      })),
      osSummary: FIXED_OS.map((o) => ({ OSplatform: o, count: osMap[o] })),
      browserSummary: FIXED_BROWSERS.map((b) => ({
        browsers: b,
        count: browserMap[b],
      })),
      deviceCategory: FIXED_DEVICES.map((d) => ({
        devices: d,
        count: deviceMap[d],
      })),
      userActivityOverTime: Object.entries(hourMap).map(([hour, count]) => ({
        hour,
        count,
      })),
      userRetention,
    };
  }
}
