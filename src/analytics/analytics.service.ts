import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays, parseISO, isValid } from 'date-fns';
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
        topCountries: FIXED_COUNTRIES.map((country) => ({ country, users: 0 })),
        sessionSources: [],
        newUsersByChannel: {},
        eventSummary: {},
        userGender: {},
        userLanguage: {},
        platformSummary: {},
        osSummary: {},
        browserSummary: {},
        deviceCategory: {},
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

    const countryMap: Record<string, number> = {};
    const channelMap: Record<string, number> = {};
    const eventMap: Record<string, number> = {};
    const genderMap: Record<string, number> = {};
    const languageMap: Record<string, number> = {};
    const platformMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};

    FIXED_COUNTRIES.forEach((c) => (countryMap[c] = 0));
    FIXED_CHANNELS.forEach((c) => (channelMap[c] = 0));
    FIXED_EVENTS.forEach((e) => (eventMap[e] = 0));
    FIXED_GENDERS.forEach((g) => (genderMap[g] = 0));
    FIXED_LANGUAGES.forEach((l) => (languageMap[l] = 0));
    FIXED_PLATFORMS.forEach((p) => (platformMap[p] = 0));
    FIXED_OS.forEach((o) => (osMap[o] = 0));
    FIXED_BROWSERS.forEach((b) => (browserMap[b] = 0));
    FIXED_DEVICES.forEach((d) => (deviceMap[d] = 0));

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

      const rowCountries = r.topCountries as Record<string, number>;
      for (const c of FIXED_COUNTRIES) {
        countryMap[c] += rowCountries?.[c] || 0;
      }

      const channels = r.newUsersByChannel as Record<string, number>;
      for (const c of FIXED_CHANNELS) {
        channelMap[c] += channels?.[c] || 0;
      }

      const events = r.eventSummary as Record<string, number>;
      for (const e of FIXED_EVENTS) {
        eventMap[e] += events?.[e] || 0;
      }

      const genders = r.userGender as Record<string, number>;
      for (const g of FIXED_GENDERS) {
        genderMap[g] += genders?.[g] || 0;
      }

      const langs = r.userLanguage as Record<string, number>;
      for (const l of FIXED_LANGUAGES) {
        languageMap[l] += langs?.[l] || 0;
      }

      const platforms = r.platformSummary as Record<string, number>;
      for (const p of FIXED_PLATFORMS) {
        platformMap[p] += platforms?.[p] || 0;
      }

      const osList = r.osSummary as Record<string, number>;
      for (const o of FIXED_OS) {
        osMap[o] += osList?.[o] || 0;
      }

      const browsers = r.browserSummary as Record<string, number>;
      for (const b of FIXED_BROWSERS) {
        browserMap[b] += browsers?.[b] || 0;
      }

      const devices = r.deviceCategory as Record<string, number>;
      for (const d of FIXED_DEVICES) {
        deviceMap[d] += devices?.[d] || 0;
      }
    }

    const avgEngagementTimeSec = Math.round(engagementSum / records.length);
    const topCountries = FIXED_COUNTRIES.map((country) => ({
      country,
      users: countryMap[country],
    }));

    return {
      ...summary,
      avgEngagementTimeSec,
      chartData: records.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        newUsers: r.newUsers,
        activeUsers: r.activeUsers,
        sessions: r.sessions,
      })),
      topCountries,
      sessionSources: [
        { type: 'direct', count: summary.directSessions },
        { type: 'referral', count: summary.referralSessions },
      ],
      newUsersByChannel: channelMap,
      eventSummary: eventMap,
      userGender: genderMap,
      userLanguage: languageMap,
      platformSummary: platformMap,
      osSummary: osMap,
      browserSummary: browserMap,
      deviceCategory: deviceMap,
    };
  }
}
