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
  'Germany',
  'United Kingdom',
  'India',
  'Brazil',
  'Canada',
  'Australia',
  'Malaysia',
  'Russia',
  'Mexico',
  'Turkey',
];
const FIXED_LANGUAGES = [
  'us', // United States
  'fr', // France
  'jp', // Japan
  'th', // Thailand
  'tw', // Taiwan
  'id', // Indonesia
  'kr', // South Korea
  'ph', // Philippines
  'sg', // Singapore
  'de', // Germany
  'gb', // United Kingdom
  'in', // India
  'br', // Brazil
  'ca', // Canada
  'au', // Australia
  'my', // Malaysia
  'ru', // Russia
  'mx', // Mexico
  'tr', // Turkey
];
const FIXED_CHANNELS = ['Direct', 'Referral', 'Organic'];
const FIXED_EVENTS = ['Signup', 'Login', 'View', 'Click'];
const FIXED_GENDERS = ['Male', 'Female', 'Other'];
const FIXED_PLATFORMS = ['Mobile', 'Website'];
const FIXED_OS = [
  'Windows',
  'Macintosh',
  'Android',
  'iOS',
  'Linux',
  'Firefox OS',
  'Chrome OS	',
];
const FIXED_BROWSERS = [
  'Chrome',
  'Firefox',
  'Edge',
  'Safari',
  'Opera',
  'InternetExplorer',
  'Chrome (in-app)',
  'Safari (in-app)',
];
const FIXED_DEVICES = ['Desktop', 'Mobile', 'Tablet'];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getValidRetentionDate(fromDate: Date): string {
    const MIN_DATE = new Date('2025-06-04');
    const today = new Date();

    // Case 1: fromDate < MIN_DATE
    if (fromDate < MIN_DATE) {
      return '2025-06-04';
    }

    // Case 2: enough for 50 days
    if (differenceInCalendarDays(today, fromDate) >= 41) {
      return fromDate.toISOString().split('T')[0];
    }

    const fallbackDate = new Date(today);
    fallbackDate.setDate(today.getDate() - 42);
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

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isFullRange =
      fromDate <= new Date('2025-05-01') && toDate >= yesterday;

    if (isFullRange) {
      const totalActiveUsers = summary.activeUsers;
      const distribution = {
        Thailand: 0.1318,
        France: 0.1217,
        'United States': 0.1207,
        Japan: 0.1195,
        Philippines: 0.114,
        Indonesia: 0.1099,
        'South Korea': 0.1078,
        Singapore: 0.1044,
        Taiwan:
          1 -
          (0.1318 +
            0.1217 +
            0.1207 +
            0.1195 +
            0.114 +
            0.1099 +
            0.1078 +
            0.1044),
      };

      activeUsersByCountry.forEach((item) => {
        item.count = Math.round(totalActiveUsers * distribution[item.country]);
      });
    }

    const validRetentionDate = this.getValidRetentionDate(fromDate);
    const retentionRecord = await this.prisma.analyticsStat.findFirst({
      where: {
        date: new Date(validRetentionDate),
      },
    });
    const userRetention = retentionRecord?.userRetention ?? [];

    return {
      ...summary,
      avgEngagementTimeSec,
      chartData: records.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        newUsers: r.newUsers,
        activeUsers: r.activeUsers,
        returningUsers: r.returningUsers,
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
