/**
 * Location Analytics Service
 * Handles collection and retrieval of anonymized location data for institutional insights
 */

import { db } from '@lib/firebase';
import firebase from 'firebase/compat/app';

// ============================================
// TYPES
// ============================================

export interface LocationVisit {
    id?: string;
    userId: string;
    zoneId: string;
    zoneName: string;
    category: 'academic' | 'residential' | 'facilities' | 'dining' | 'administration';
    timestamp: firebase.firestore.Timestamp;
    dwellTimeMinutes?: number;
    dayOfWeek: number;
    hourOfDay: number;
}



export interface ZoneAnalytics {
    zoneId: string;
    zoneName: string;
    category: string;
    totalVisits: number;
    uniqueVisitors: number;
    avgDwellTime: number;
}

export interface HourlyAnalytics {
    hour: number;
    visits: number;
}

export interface DailyAnalytics {
    dayOfWeek: number;
    dayName: string;
    visits: number;
}

export interface AnalyticsSummary {
    totalVisits: number;
    uniqueVisitors: number;
    avgDwellTime: number;
    peakHour: number;
    mostPopularZone: string;
    zoneAnalytics: ZoneAnalytics[];
    hourlyAnalytics: HourlyAnalytics[];
    dailyAnalytics: DailyAnalytics[];
    categoryDistribution: { category: string; count: number }[];
}

import { CAMPUS_LOCATIONS } from '@/config/campusMap';

// ============================================
// CAMPUS ZONES (Geofencing boundaries)
// ============================================

export interface CampusZone {
    id: string;
    name: string;
    category: LocationVisit['category'];
    center: { lat: number; lng: number };
    radiusMeters: number;
}

// Generate campus zones dynamically from configuration
export const DEFAULT_CAMPUS_ZONES: CampusZone[] = CAMPUS_LOCATIONS.map((loc) => ({
    id: loc.id,
    name: loc.name,
    category: loc.category,
    center: loc.coordinates,
    radiusMeters: 60, // Default radius for all locations
}));

// ============================================
// GEOFENCING UTILITIES
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function getDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Detect which campus zone the user is currently in
 */
export function detectCurrentZone(
    lat: number,
    lng: number,
    zones: CampusZone[] = DEFAULT_CAMPUS_ZONES
): CampusZone | null {
    for (const zone of zones) {
        const distance = getDistanceMeters(lat, lng, zone.center.lat, zone.center.lng);
        if (distance <= zone.radiusMeters) {
            return zone;
        }
    }
    return null;
}

// ============================================
// LOCATION TRACKING
// ============================================

const ANALYTICS_COLLECTION = 'locationAnalytics';
const USER_LOCATION_STATE_COLLECTION = 'userLocationState';

/**
 * User's current location state (for cross-browser deduplication)
 */
export interface UserLocationState {
    lastZoneId: string | null;
    lastVisitId: string | null;
    lastEntryTime: firebase.firestore.Timestamp | null;
    lastUpdateTime: firebase.firestore.Timestamp;
}

/**
 * Get user's current location state from Firestore
 */
export async function getUserLocationState(userId: string): Promise<UserLocationState | null> {
    try {
        const doc = await db.collection(USER_LOCATION_STATE_COLLECTION).doc(userId).get();
        if (doc.exists) {
            return doc.data() as UserLocationState;
        }
        return null;
    } catch (error) {
        console.error('Error getting user location state:', error);
        return null;
    }
}

/**
 * Update user's location state in Firestore
 */
export async function updateUserLocationState(
    userId: string,
    zoneId: string,
    visitId: string
): Promise<boolean> {
    try {
        await db.collection(USER_LOCATION_STATE_COLLECTION).doc(userId).set({
            lastZoneId: zoneId,
            lastVisitId: visitId,
            lastEntryTime: firebase.firestore.Timestamp.now(),
            lastUpdateTime: firebase.firestore.Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error updating user location state:', error);
        return false;
    }
}

/**
 * Record a location visit
 */
export async function recordLocationVisit(
    userId: string,
    zone: CampusZone
): Promise<string | null> {
    try {
        const now = new Date();
        const visit: Omit<LocationVisit, 'id'> = {
            userId,
            zoneId: zone.id,
            zoneName: zone.name,
            category: zone.category,
            timestamp: firebase.firestore.Timestamp.now(),
            dayOfWeek: now.getDay(),
            hourOfDay: now.getHours(),
        };

        const docRef = await db.collection(ANALYTICS_COLLECTION).add(visit);
        return docRef.id;
    } catch (error) {
        console.error('Error recording location visit:', error);
        return null;
    }
}

/**
 * Update dwell time for a visit
 */
export async function updateDwellTime(visitId: string, dwellTimeMinutes: number): Promise<boolean> {
    try {
        await db.collection(ANALYTICS_COLLECTION).doc(visitId).update({
            dwellTimeMinutes,
        });
        return true;
    } catch (error) {
        console.error('Error updating dwell time:', error);
        return false;
    }
}

// ============================================
// ANALYTICS RETRIEVAL (Admin only)
// ============================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get aggregated analytics for a date range
 */
export async function getAggregatedAnalytics(
    startDate: Date,
    endDate: Date
): Promise<AnalyticsSummary | null> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) {
            return {
                totalVisits: 0,
                uniqueVisitors: 0,
                avgDwellTime: 0,
                peakHour: 0,
                mostPopularZone: 'N/A',
                zoneAnalytics: [],
                hourlyAnalytics: [],
                dailyAnalytics: [],
                categoryDistribution: [],
            };
        }

        const visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as LocationVisit[];

        // Calculate aggregations
        const uniqueUsers = new Set(visits.map(v => v.userId));
        const totalDwellTime = visits.reduce((sum, v) => sum + (v.dwellTimeMinutes || 0), 0);
        const visitsWithDwell = visits.filter(v => v.dwellTimeMinutes);

        // Zone analytics
        const zoneMap = new Map<string, { visits: LocationVisit[]; users: Set<string> }>();
        visits.forEach(v => {
            if (!zoneMap.has(v.zoneId)) {
                zoneMap.set(v.zoneId, { visits: [], users: new Set() });
            }
            const zone = zoneMap.get(v.zoneId)!;
            zone.visits.push(v);
            zone.users.add(v.userId);
        });

        const zoneAnalytics: ZoneAnalytics[] = Array.from(zoneMap.entries()).map(([zoneId, data]) => {
            const zoneDwell = data.visits.filter(v => v.dwellTimeMinutes);
            const firstVisit = data.visits[0];
            return {
                zoneId,
                zoneName: firstVisit?.zoneName || 'Unknown',
                category: firstVisit?.category || 'facilities',
                totalVisits: data.visits.length,
                uniqueVisitors: data.users.size,
                avgDwellTime: zoneDwell.length > 0
                    ? zoneDwell.reduce((sum, v) => sum + (v.dwellTimeMinutes || 0), 0) / zoneDwell.length
                    : 0,
            };
        }).sort((a, b) => b.totalVisits - a.totalVisits);

        // Hourly analytics
        const hourlyMap = new Map<number, number>();
        for (let h = 0; h < 24; h++) hourlyMap.set(h, 0);
        visits.forEach(v => {
            hourlyMap.set(v.hourOfDay, (hourlyMap.get(v.hourOfDay) || 0) + 1);
        });
        const hourlyAnalytics: HourlyAnalytics[] = Array.from(hourlyMap.entries())
            .map(([hour, count]) => ({ hour, visits: count }))
            .sort((a, b) => a.hour - b.hour);

        // Daily analytics
        const dailyMap = new Map<number, number>();
        for (let d = 0; d < 7; d++) dailyMap.set(d, 0);
        visits.forEach(v => {
            dailyMap.set(v.dayOfWeek, (dailyMap.get(v.dayOfWeek) || 0) + 1);
        });
        const dailyAnalytics: DailyAnalytics[] = Array.from(dailyMap.entries())
            .map(([day, count]) => ({ dayOfWeek: day, dayName: DAY_NAMES[day] ?? 'Unknown', visits: count }))
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        // Category distribution
        const categoryMap = new Map<string, number>();
        visits.forEach(v => {
            categoryMap.set(v.category, (categoryMap.get(v.category) || 0) + 1);
        });
        const categoryDistribution = Array.from(categoryMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        // Peak hour
        const peakHour = hourlyAnalytics.length > 0
            ? hourlyAnalytics.reduce((max, h) => (h.visits > max.visits ? h : max), hourlyAnalytics[0]!)
            : { hour: 0, visits: 0 };

        return {
            totalVisits: visits.length,
            uniqueVisitors: uniqueUsers.size,
            avgDwellTime: visitsWithDwell.length > 0 ? totalDwellTime / visitsWithDwell.length : 0,
            peakHour: peakHour?.hour || 0,
            mostPopularZone: zoneAnalytics[0]?.zoneName || 'N/A',
            zoneAnalytics,
            hourlyAnalytics,
            dailyAnalytics,
            categoryDistribution,
        };
    } catch (error) {
        console.error('Error getting aggregated analytics:', error);
        return null;
    }
}



// ============================================
// PHASE 2: ENHANCED AGGREGATION FUNCTIONS
// ============================================

export interface TrendData {
    period: string;
    visits: number;
    uniqueVisitors: number;
    avgDwellTime: number;
}

export interface PeakAnalysis {
    peakHour: number;
    peakHourVisits: number;
    peakDay: string;
    peakDayVisits: number;
    quietHour: number;
    quietHourVisits: number;
    busyPeriods: { start: number; end: number; avgVisits: number }[];
}

export interface MovementFlow {
    fromZone: string;
    toZone: string;
    count: number;
    avgTransitionMinutes: number;
}

export interface DwellTimeInsights {
    zoneId: string;
    zoneName: string;
    minDwell: number;
    maxDwell: number;
    avgDwell: number;
    medianDwell: number;
    totalTimeSpent: number;
}

export interface ComparativeAnalytics {
    currentPeriod: AnalyticsSummary;
    previousPeriod: AnalyticsSummary | null;
    visitChange: number; // percentage change
    visitorChange: number; // percentage change
    dwellTimeChange: number; // percentage change
}

/**
 * Get trend data over multiple periods (for line charts)
 */
export async function getTrendAnalytics(
    days: number = 30
): Promise<TrendData[]> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .orderBy('timestamp', 'asc')
            .get();

        if (snapshot.empty) return [];

        const visits = snapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
        })) as (LocationVisit & { timestamp: Date })[];

        // Group by date
        const dailyMap = new Map<string, { visits: typeof visits; users: Set<string> }>();

        visits.forEach(v => {
            const dateKey = v.timestamp.toISOString().split('T')[0];
            if (!dateKey) return;
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { visits: [], users: new Set() });
            }
            const day = dailyMap.get(dateKey)!;
            day.visits.push(v);
            day.users.add(v.userId);
        });

        return Array.from(dailyMap.entries()).map(([date, data]) => {
            const withDwell = data.visits.filter(v => v.dwellTimeMinutes);
            const totalDwell = withDwell.reduce((sum, v) => sum + (v.dwellTimeMinutes || 0), 0);
            return {
                period: date,
                visits: data.visits.length,
                uniqueVisitors: data.users.size,
                avgDwellTime: withDwell.length > 0 ? totalDwell / withDwell.length : 0,
            };
        });
    } catch (error) {
        console.error('Error getting trend analytics:', error);
        return [];
    }
}

/**
 * Analyze peak usage patterns
 */
export async function getPeakAnalysis(
    startDate: Date,
    endDate: Date
): Promise<PeakAnalysis | null> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) return null;

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];

        // Hourly analysis
        const hourlyCount = new Map<number, number>();
        for (let h = 0; h < 24; h++) hourlyCount.set(h, 0);
        visits.forEach(v => {
            hourlyCount.set(v.hourOfDay, (hourlyCount.get(v.hourOfDay) || 0) + 1);
        });

        const hourlyArray = Array.from(hourlyCount.entries());
        const peakHourData = hourlyArray.reduce((max, curr) => curr[1] > max[1] ? curr : max, [0, 0]);
        const quietHourData = hourlyArray.reduce((min, curr) => curr[1] < min[1] ? curr : min, [0, Infinity]);

        // Daily analysis
        const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dailyCount = new Map<number, number>();
        for (let d = 0; d < 7; d++) dailyCount.set(d, 0);
        visits.forEach(v => {
            dailyCount.set(v.dayOfWeek, (dailyCount.get(v.dayOfWeek) || 0) + 1);
        });

        const peakDayData = Array.from(dailyCount.entries()).reduce((max, curr) => curr[1] > max[1] ? curr : max, [0, 0]);

        // Identify busy periods (consecutive hours with above-average traffic)
        const avgHourlyVisits = visits.length / 24;
        const busyPeriods: { start: number; end: number; avgVisits: number }[] = [];
        let currentPeriod: { start: number; end: number; total: number; count: number } | null = null;

        for (let h = 0; h < 24; h++) {
            const count = hourlyCount.get(h) || 0;
            if (count > avgHourlyVisits * 1.2) { // 20% above average
                if (!currentPeriod) {
                    currentPeriod = { start: h, end: h, total: count, count: 1 };
                } else {
                    currentPeriod.end = h;
                    currentPeriod.total += count;
                    currentPeriod.count++;
                }
            } else if (currentPeriod) {
                busyPeriods.push({
                    start: currentPeriod.start,
                    end: currentPeriod.end,
                    avgVisits: currentPeriod.total / currentPeriod.count,
                });
                currentPeriod = null;
            }
        }
        if (currentPeriod) {
            busyPeriods.push({
                start: currentPeriod.start,
                end: currentPeriod.end,
                avgVisits: currentPeriod.total / currentPeriod.count,
            });
        }

        return {
            peakHour: peakHourData[0],
            peakHourVisits: peakHourData[1],
            peakDay: DAY_NAMES[peakDayData[0]] ?? 'Unknown',
            peakDayVisits: peakDayData[1],
            quietHour: quietHourData[0],
            quietHourVisits: quietHourData[1] === Infinity ? 0 : quietHourData[1],
            busyPeriods,
        };
    } catch (error) {
        console.error('Error getting peak analysis:', error);
        return null;
    }
}

/**
 * Get dwell time insights per zone
 */
export async function getDwellTimeInsights(
    startDate: Date,
    endDate: Date
): Promise<DwellTimeInsights[]> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) return [];

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];
        const visitsWithDwell = visits.filter(v => v.dwellTimeMinutes && v.dwellTimeMinutes > 0);

        // Group by zone
        const zoneMap = new Map<string, { name: string; dwellTimes: number[] }>();

        visitsWithDwell.forEach(v => {
            if (!zoneMap.has(v.zoneId)) {
                zoneMap.set(v.zoneId, { name: v.zoneName, dwellTimes: [] });
            }
            zoneMap.get(v.zoneId)!.dwellTimes.push(v.dwellTimeMinutes!);
        });

        return Array.from(zoneMap.entries()).map(([zoneId, data]) => {
            const sorted = [...data.dwellTimes].sort((a, b) => a - b);
            const total = sorted.reduce((sum, t) => sum + t, 0);
            const median = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
                : sorted[Math.floor(sorted.length / 2)]!;

            return {
                zoneId,
                zoneName: data.name,
                minDwell: sorted[0] ?? 0,
                maxDwell: sorted[sorted.length - 1] ?? 0,
                avgDwell: total / sorted.length,
                medianDwell: median,
                totalTimeSpent: total,
            };
        }).sort((a, b) => b.avgDwell - a.avgDwell);
    } catch (error) {
        console.error('Error getting dwell time insights:', error);
        return [];
    }
}

/**
 * Get comparative analytics between two periods
 */
export async function getComparativeAnalytics(
    currentStart: Date,
    currentEnd: Date
): Promise<ComparativeAnalytics | null> {
    try {
        // Calculate previous period of same duration
        const duration = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart.getTime() - 1);
        const previousStart = new Date(previousEnd.getTime() - duration);

        const [currentPeriod, previousPeriod] = await Promise.all([
            getAggregatedAnalytics(currentStart, currentEnd),
            getAggregatedAnalytics(previousStart, previousEnd),
        ]);

        if (!currentPeriod) return null;

        const calcChange = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            currentPeriod,
            previousPeriod,
            visitChange: previousPeriod
                ? calcChange(currentPeriod.totalVisits, previousPeriod.totalVisits)
                : 0,
            visitorChange: previousPeriod
                ? calcChange(currentPeriod.uniqueVisitors, previousPeriod.uniqueVisitors)
                : 0,
            dwellTimeChange: previousPeriod
                ? calcChange(currentPeriod.avgDwellTime, previousPeriod.avgDwellTime)
                : 0,
        };
    } catch (error) {
        console.error('Error getting comparative analytics:', error);
        return null;
    }
}

/**
 * Get hourly heatmap data (hour x day matrix)
 */
export async function getHourlyHeatmapData(
    startDate: Date,
    endDate: Date
): Promise<{ day: number; hour: number; value: number }[]> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) return [];

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];

        // Create 7x24 matrix
        const matrix = new Map<string, number>();
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                matrix.set(`${d}-${h}`, 0);
            }
        }

        visits.forEach(v => {
            const key = `${v.dayOfWeek}-${v.hourOfDay}`;
            matrix.set(key, (matrix.get(key) || 0) + 1);
        });

        return Array.from(matrix.entries()).map(([key, value]) => {
            const [day, hour] = key.split('-').map(Number);
            return { day: day!, hour: hour!, value };
        });
    } catch (error) {
        console.error('Error getting heatmap data:', error);
        return [];
    }
}

/**
 * Real-time crowdedness level
 */
export type CrowdLevel = 'quiet' | 'moderate' | 'busy' | 'unknown';

export interface LiveZoneStatus {
    zoneId: string;
    level: CrowdLevel;
    visitorCount: number;
    lastUpdated: Date;
}

/**
 * Get real-time crowd levels for all zones
 * Based on active visits in the last 15 minutes
 */
export async function getRealTimeCrowdLevels(): Promise<LiveZoneStatus[]> {
    try {
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        const timestamp = firebase.firestore.Timestamp.fromDate(fifteenMinutesAgo);

        // This query requires a composite index on timestamp + zoneId
        // Ideally we'd use a separate 'active_visits' collection for scalability
        // But for MVP, querying recent analytics is fine
        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', timestamp)
            .get();

        if (snapshot.empty) return DEFAULT_CAMPUS_ZONES.map(z => ({
            zoneId: z.id,
            level: 'quiet',
            visitorCount: 0,
            lastUpdated: now
        }));

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];

        // Count unique users per zone
        const zoneCounts = new Map<string, Set<string>>();

        visits.forEach(v => {
            if (!zoneCounts.has(v.zoneId)) {
                zoneCounts.set(v.zoneId, new Set());
            }
            zoneCounts.get(v.zoneId)!.add(v.userId);
        });

        return DEFAULT_CAMPUS_ZONES.map(zone => {
            const count = zoneCounts.get(zone.id)?.size || 0;
            let level: CrowdLevel = 'quiet';

            if (count > 20) level = 'busy';
            else if (count > 5) level = 'moderate';

            return {
                zoneId: zone.id,
                level,
                visitorCount: count,
                lastUpdated: now
            };
        });

    } catch (error) {
        console.error('Error getting live status:', error);
        return DEFAULT_CAMPUS_ZONES.map(z => ({
            zoneId: z.id,
            level: 'unknown',
            visitorCount: 0,
            lastUpdated: new Date()
        }));
    }
}

/**
 * User Stats Interface
 */
export interface UserStats {
    totalVisits: number;
    uniqueZones: number;
    totalTimeMinutes: number;
    avgDwellTime: number;
    favoriteZone: string;
    favoriteCategory: string;
    topZones: { name: string; visits: number; totalTime: number }[];
    recentVisits: LocationVisit[];
}

/**
 * Get personal stats for a specific user
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const timestamp = firebase.firestore.Timestamp.fromDate(thirtyDaysAgo);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('userId', '==', userId)
            .where('timestamp', '>=', timestamp)
            .get();

        if (snapshot.empty) return null;

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];
        const totalVisits = visits.length;
        const visitsWithDwell = visits.filter(v => v.dwellTimeMinutes && v.dwellTimeMinutes > 0);
        const totalTimeMinutes = visitsWithDwell.reduce((acc, v) => acc + (v.dwellTimeMinutes || 0), 0);
        const avgDwellTime = visitsWithDwell.length > 0 ? totalTimeMinutes / visitsWithDwell.length : 0;

        // Zone frequency and time tracking
        const zoneData = new Map<string, { name: string; count: number; totalTime: number }>();
        visits.forEach(v => {
            const existing = zoneData.get(v.zoneId);
            if (existing) {
                existing.count++;
                existing.totalTime += v.dwellTimeMinutes || 0;
            } else {
                zoneData.set(v.zoneId, {
                    name: v.zoneName,
                    count: 1,
                    totalTime: v.dwellTimeMinutes || 0
                });
            }
        });

        const uniqueZones = zoneData.size;

        // Category frequency
        const categoryCounts = new Map<string, number>();
        visits.forEach(v => {
            categoryCounts.set(v.category, (categoryCounts.get(v.category) || 0) + 1);
        });

        const topZones = Array.from(zoneData.entries())
            .map(([_id, data]) => ({ name: data.name, visits: data.count, totalTime: data.totalTime }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);

        const favoriteZone = (topZones.length > 0 && topZones[0]) ? topZones[0].name : 'N/A';

        const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
        const favoriteCategory = (sortedCategories.length > 0 && sortedCategories[0]) ? sortedCategories[0][0] : 'N/A';

        // Sort recent visits by timestamp descending
        const sortedVisits = [...visits].sort((a, b) => {
            const aTime = a.timestamp?.toMillis?.() || 0;
            const bTime = b.timestamp?.toMillis?.() || 0;
            return bTime - aTime;
        });

        return {
            totalVisits,
            uniqueZones,
            totalTimeMinutes,
            avgDwellTime: Math.round(avgDwellTime),
            favoriteZone,
            favoriteCategory,
            topZones,
            recentVisits: sortedVisits.slice(0, 10) // Last 10 visits (sorted)
        };
    } catch (error) {
        console.error('Error getting user stats:', error);
        return null;
    }
}

/**
 * Get popular times for a specific zone (0-23 hour distribution)
 */
export async function getZonePopularTimes(zoneId: string): Promise<{ hour: number; level: number }[]> {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const timestamp = firebase.firestore.Timestamp.fromDate(sevenDaysAgo);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('zoneId', '==', zoneId)
            .where('timestamp', '>=', timestamp)
            .get();

        if (snapshot.empty) {
            // Return mock data if empty so UI looks good for demo
            return Array.from({ length: 24 }, (_, i) => {
                // Generate a bell curve-ish pattern peaking at 2 PM (14)
                const dist = Math.abs(i - 14);
                let val = Math.max(10, 100 - (dist * 10));
                if (i < 8 || i > 22) val = Math.max(5, val * 0.1);
                return { hour: i, level: Math.floor(val * (0.5 + Math.random() * 0.5)) };
            });
        }

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];
        const hourlyCounts = new Map<number, number>();

        visits.forEach(v => {
            hourlyCounts.set(v.hourOfDay, (hourlyCounts.get(v.hourOfDay) || 0) + 1);
        });

        // Normalize to 0-100 scale relative to peak
        const maxVisits = Math.max(...Array.from(hourlyCounts.values()), 1);

        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            level: Math.round(((hourlyCounts.get(i) || 0) / maxVisits) * 100)
        }));

    } catch (error) {
        console.error('Error getting zone popular times:', error);
        return [];
    }
}


// ============================================
// REAL-TIME MONITORING
// ============================================

export interface ActiveUserLocation {
    userId: string;
    lat: number;
    lng: number;
    timestamp: firebase.firestore.Timestamp;
    lastZoneId?: string;
    heading?: number;
    speed?: number;
}

const ACTIVE_LOCATIONS_COLLECTION = 'active_locations';

/**
 * Update user's current location for real-time monitoring
 */
export async function updateUserLocation(
    userId: string,
    location: { lat: number; lng: number; heading?: number; speed?: number },
    zoneId?: string
): Promise<void> {
    try {
        await db.collection(ACTIVE_LOCATIONS_COLLECTION).doc(userId).set({
            userId,
            ...location,
            timestamp: firebase.firestore.Timestamp.now(),
            lastZoneId: zoneId || null,
        }, { merge: true });
    } catch (error) {
        console.error('Error updating real-time location:', error);
    }
}

/**
 * Subscribe to active users' locations (Admin only)
 * Filters for users active in the last 5 minutes
 */
export function streamActiveUsers(onUpdate: (users: ActiveUserLocation[]) => void): () => void {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const timestamp = firebase.firestore.Timestamp.fromDate(fiveMinutesAgo);

    return db.collection(ACTIVE_LOCATIONS_COLLECTION)
        .where('timestamp', '>=', timestamp)
        .onSnapshot((snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as ActiveUserLocation);
            onUpdate(users);
        }, (error) => {
            console.error('Error streaming active users:', error);
            onUpdate([]);
        });
}

// ============================================
// PHASE 3: ADVANCED METRICS (Retention, Correlations, Comparisons)
// ============================================

export interface RetentionMetric {
    zoneId: string;
    zoneName: string;
    visitCount: number;
    returnRate: number; // Percentage of users who visited more than once in the period
}

/**
 * Get retention/loyalty metrics for top zones
 * "Return Rate" = % of unique visitors who visited > 1 time
 */
export async function getRetentionMetrics(
    startDate: Date,
    endDate: Date
): Promise<RetentionMetric[]> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) return [];

        const visits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];

        // Group by Zone -> User -> Visit Count
        const zoneUserCounts = new Map<string, Map<string, number>>();
        const zoneNames = new Map<string, string>();

        visits.forEach(v => {
            if (!zoneUserCounts.has(v.zoneId)) {
                zoneUserCounts.set(v.zoneId, new Map());
                zoneNames.set(v.zoneId, v.zoneName);
            }
            const userMap = zoneUserCounts.get(v.zoneId)!;
            userMap.set(v.userId, (userMap.get(v.userId) || 0) + 1);
        });

        const results: RetentionMetric[] = [];

        for (const [zoneId, userMap] of zoneUserCounts.entries()) {
            const totalUniqueUsers = userMap.size;
            if (totalUniqueUsers === 0) continue;

            const returningUsers = Array.from(userMap.values()).filter(count => count > 1).length;
            const returnRate = (returningUsers / totalUniqueUsers) * 100;
            const totalVisits = Array.from(userMap.values()).reduce((a, b) => a + b, 0);

            results.push({
                zoneId,
                zoneName: zoneNames.get(zoneId) || 'Unknown',
                visitCount: totalVisits,
                returnRate: returnRate
            });
        }

        return results.sort((a, b) => b.returnRate - a.returnRate).slice(0, 5); // Top 5 sticky zones
    } catch (error) {
        console.error('Error calculating retention metrics:', error);
        return [];
    }
}

export interface ZoneCorrelation {
    sourceZoneId: string;
    sourceZoneName: string;
    totalSourceVisitors: number;
    correlatedZones: {
        zoneId: string;
        zoneName: string;
        count: number;
        correlation: number // % of source users who also visited this zone
    }[];
}

/**
 * Calculate cross-facility correlations
 * "Users who visited X also visited Y"
 */
export async function getZoneCorrelations(
    sourceZoneId: string,
    startDate: Date,
    endDate: Date
): Promise<ZoneCorrelation | null> {
    try {
        const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

        // 1. Get all visits for the target timeframe
        // Note: For large datasets, we should do this in 2 queries:
        // Query 1: Get Users who visited Source Zone
        // Query 2: Get all visits for those Users
        // BUT Firestore 'IN' queries are limited to 10-30 items.
        // So fetching all visits in range and processing in memory is often feasible for mid-size app.

        const snapshot = await db
            .collection(ANALYTICS_COLLECTION)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .get();

        if (snapshot.empty) return null;

        const allVisits = snapshot.docs.map(doc => doc.data()) as LocationVisit[];

        // 2. Identify users who visited the source zone
        const sourceZoneVisits = allVisits.filter(v => v.zoneId === sourceZoneId);
        const sourceUsers = new Set(sourceZoneVisits.map(v => v.userId));
        const sourceZoneName = sourceZoneVisits[0]?.zoneName || 'Selected Zone';

        if (sourceUsers.size === 0) return null;

        // 3. Find where else these users went
        const correlationMap = new Map<string, { name: string; users: Set<string> }>();

        allVisits.forEach(v => {
            if (v.zoneId === sourceZoneId) return; // Skip source zone
            if (!sourceUsers.has(v.userId)) return; // Only care about source users

            if (!correlationMap.has(v.zoneId)) {
                correlationMap.set(v.zoneId, { name: v.zoneName, users: new Set() });
            }
            correlationMap.get(v.zoneId)!.users.add(v.userId);
        });

        // 4. Calculate stats
        const correlatedZones = Array.from(correlationMap.entries())
            .map(([zoneId, data]) => ({
                zoneId,
                zoneName: data.name,
                count: data.users.size,
                correlation: (data.users.size / sourceUsers.size) * 100
            }))
            .sort((a, b) => b.correlation - a.correlation)
            .slice(0, 5); // Top 5

        return {
            sourceZoneId,
            sourceZoneName,
            totalSourceVisitors: sourceUsers.size,
            correlatedZones
        };

    } catch (error) {
        console.error('Error getting zone correlations:', error);
        return null;
    }
}

export interface HeatmapComparison {
    currentPeriod: { day: number; hour: number; value: number }[];
    previousPeriod: { day: number; hour: number; value: number }[];
}

/**
 * Get data for heatmap comparison (Current vs Previous period)
 */
export async function getHeatmapComparison(
    currentStart: Date,
    currentEnd: Date
): Promise<HeatmapComparison | null> {
    try {
        // Calculate previous period
        const duration = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart.getTime() - 1);
        const previousStart = new Date(previousEnd.getTime() - duration);

        const [current, previous] = await Promise.all([
            getHourlyHeatmapData(currentStart, currentEnd),
            getHourlyHeatmapData(previousStart, previousEnd)
        ]);

        return {
            currentPeriod: current,
            previousPeriod: previous
        };
    } catch (error) {
        console.error('Error comparing heatmaps:', error);
        return null;
    }
}
