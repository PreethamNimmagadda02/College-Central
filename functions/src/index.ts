import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  organizer: string;
  imageUrl: string;
  sourceUrl?: string;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  category: string;
  author: string;
  sourceUrl?: string;
}

interface GeminiSearchResult {
  events: Omit<CampusEvent, 'id'>[];
  announcements: Omit<Announcement, 'id'>[];
}

/**
 * Fetches latest news, events, and announcements about IIT Dhanbad using Gemini AI
 */
async function fetchIITDhanbadUpdates(): Promise<GeminiSearchResult> {
  const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are gathering the LATEST and MOST RECENT information about IIT Dhanbad (Indian Institute of Technology Dhanbad, formerly ISM Dhanbad) for the current academic year 2025-26.

CRITICAL: Today's date is October 16, 2025. ONLY include information from 2025 onwards. DO NOT include any events or announcements from 2024 or earlier.

Search for and provide ONLY RECENT information from these SPECIFIC SOURCES:

OFFICIAL WEBSITES (PRIORITY - Search these first):
- https://www.iitism.ac.in (main site)
- https://www.iitism.ac.in/dept-event-list (department events)
- https://www.iitism.ac.in/all-active-notices (official notices)
- https://www.iitism.ac.in/seminar-1 (seminars)
- https://people.iitism.ac.in/~mbc/mbcpress_release (press releases)
- IIT ISM Alumni Association website

NEWS SOURCES (Search for "IIT Dhanbad" OR "IIT ISM"):
- economictimes.indiatimes.com
- indiatoday.in
- newsonair.gov.in
- ndtv.com
- timesofindia.indiatimes.com
- thejharkhandstory.com
- hindustantimes.com

SOCIAL MEDIA (Check recent posts):
- Instagram: iit_ism, concetto.iitism, srijan.iitism, parakram.iitism, studentgymkhana.iitism, basant.iitism
- LinkedIn: Search for "IIT ISM Dhanbad", "Concetto IIT ISM", "Srijan IIT ISM", "Parakram IIT ISM", "Basant IIT ISM", "Student Gymkhana IIT ISM"
- Facebook: IIT (ISM) Dhanbad official page

INFORMATION TO FETCH:
1. UPCOMING campus events (October 2025 onwards - workshops, seminars, cultural events, technical fests, placements)
2. CURRENT academic announcements (October 2025 onwards - exam schedules, registration dates, important notices)
3. LATEST campus news (October 2025 - achievements, initiatives, collaborations, infrastructure updates)

MANDATORY REQUIREMENTS:
- Generate realistic upcoming events and announcements based on typical IIT Dhanbad academic calendar
- ALL dates MUST be from October 16, 2025 onwards
- Use REAL URLs from the sources listed above (iitism.ac.in/dept-event-list, iitism.ac.in/all-active-notices, etc.)
- For sourceUrl field, use the appropriate URL from the list above based on content type:
  * Events: https://www.iitism.ac.in/dept-event-list
  * Notices: https://www.iitism.ac.in/all-active-notices
  * Seminars: https://www.iitism.ac.in/seminar-1
  * Press releases: https://people.iitism.ac.in/~mbc/mbcpress_release
- For fests: Concetto (technical), Srijan (literary-cultural), Basant (spring fest), Parakram (sports)
- Generate 8-12 realistic items based on typical IIT academic calendar patterns

For each item, provide:
- Title
- Date (YYYY-MM-DD format, MUST be 2025-10-16 or later)
- Description/Content (realistic and detailed)
- Category (Academic/Cultural/Technical/Sports/General)
- Organizer/Author
- Source URL (use iitism.ac.in URLs or placeholder)

Return your response in valid JSON format:
{
  "events": [
    {
      "title": "Event Title",
      "date": "2025-10-20",
      "time": "10:00 AM - 12:00 PM",
      "location": "Venue Name",
      "description": "Detailed description",
      "category": "Technical",
      "organizer": "Organizing Body",
      "imageUrl": "https://via.placeholder.com/800x400?text=IIT+Dhanbad+Event",
      "sourceUrl": "https://iitism.ac.in/events"
    }
  ],
  "announcements": [
    {
      "title": "Announcement Title",
      "date": "2025-10-16",
      "content": "Announcement content",
      "category": "Academic",
      "author": "Administration",
      "sourceUrl": "https://iitism.ac.in/announcements"
    }
  ]
}

CRITICAL VALIDATION:
- Verify ALL dates are >= 2025-10-16
- All sourceUrl fields must use one of the official URLs listed above (iitism.ac.in URLs)
- Generate realistic content appropriate for each source type
- Include at least 8-12 diverse items (mix of events and announcements)`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
      }
    }

    const data: GeminiSearchResult = JSON.parse(jsonText);

    // Validate and sanitize the data
    if (!data.events) data.events = [];
    if (!data.announcements) data.announcements = [];

    // Fix and validate URLs
    const validUrls = [
      'https://www.iitism.ac.in',
      'https://www.iitism.ac.in/dept-event-list',
      'https://www.iitism.ac.in/all-active-notices',
      'https://www.iitism.ac.in/seminar-1',
      'https://people.iitism.ac.in/~mbc/mbcpress_release'
    ];

    // Ensure all events have valid URLs
    data.events = data.events.map(event => {
      if (!event.sourceUrl || !validUrls.includes(event.sourceUrl)) {
        // Default to dept-event-list for events
        event.sourceUrl = 'https://www.iitism.ac.in/dept-event-list';
      }
      return event;
    });

    // Ensure all announcements have valid URLs
    data.announcements = data.announcements.map(announcement => {
      if (!announcement.sourceUrl || !validUrls.includes(announcement.sourceUrl)) {
        // Default to all-active-notices for announcements
        announcement.sourceUrl = 'https://www.iitism.ac.in/all-active-notices';
      }
      return announcement;
    });

    return data;
  } catch (error) {
    console.error('Error fetching IIT Dhanbad updates:', error);
    throw error;
  }
}

/**
 * Stores events in Firestore, avoiding duplicates and filtering old dates
 */
async function storeEvents(events: Omit<CampusEvent, 'id'>[]): Promise<void> {
  const eventsRef = db.collection('events');
  const cutoffDate = '2025-6-01'; // Only store events from October 2025 onwards

  for (const event of events) {
    // Skip events with old dates (before October 2025)
    if (event.date < cutoffDate) {
      console.log(`Skipping old event (${event.date}): ${event.title}`);
      continue;
    }

    // Check for duplicates based on title and date
    const existingQuery = await eventsRef
      .where('title', '==', event.title)
      .where('date', '==', event.date)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      // Add new event
      await eventsRef.add({
        ...event,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Added new event (${event.date}): ${event.title}`);
    } else {
      // Update existing event
      const docId = existingQuery.docs[0].id;
      await eventsRef.doc(docId).update({
        ...event,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Updated existing event (${event.date}): ${event.title}`);
    }
  }
}

/**
 * Stores announcements in Firestore, avoiding duplicates and filtering old dates
 */
async function storeAnnouncements(announcements: Omit<Announcement, 'id'>[]): Promise<void> {
  const newsRef = db.collection('news');
  const cutoffDate = '2025-6-01'; // Only store announcements from October 2025 onwards

  for (const announcement of announcements) {
    // Skip announcements with old dates (before October 2025)
    if (announcement.date < cutoffDate) {
      console.log(`Skipping old announcement (${announcement.date}): ${announcement.title}`);
      continue;
    }

    // Check for duplicates based on title and date
    const existingQuery = await newsRef
      .where('title', '==', announcement.title)
      .where('date', '==', announcement.date)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      // Add new announcement
      await newsRef.add({
        ...announcement,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Added new announcement (${announcement.date}): ${announcement.title}`);
    } else {
      // Update existing announcement
      const docId = existingQuery.docs[0].id;
      await newsRef.doc(docId).update({
        ...announcement,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Updated existing announcement (${announcement.date}): ${announcement.title}`);
    }
  }
}

/**
 * Cloud Function that runs every 6 hours to fetch and store IIT Dhanbad updates
 * Schedule: 0 at every 6th hour (runs at 00:00, 06:00, 12:00, 18:00)
 */
export const fetchIITDhanbadData = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('*/2 * * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    console.log('Starting scheduled fetch of IIT Dhanbad updates...');

    try {
      const data = await fetchIITDhanbadUpdates();

      console.log(`Fetched ${data.events.length} events and ${data.announcements.length} announcements`);

      // Store in Firestore
      await storeEvents(data.events);
      await storeAnnouncements(data.announcements);

      console.log('Successfully completed IIT Dhanbad data fetch and storage');
      return null;
    } catch (error) {
      console.error('Error in scheduled function:', error);
      throw error;
    }
  });

/**
 * HTTP callable function to manually trigger the data fetch
 * Useful for testing and immediate updates
 */
export const manualFetchIITDhanbadData = functions.https.onCall(async () => {
  console.log('Manual fetch triggered');

  try {
    const updates = await fetchIITDhanbadUpdates();

    console.log(`Fetched ${updates.events.length} events and ${updates.announcements.length} announcements`);

    await storeEvents(updates.events);
    await storeAnnouncements(updates.announcements);

    return {
      success: true,
      message: `Successfully fetched and stored ${updates.events.length} events and ${updates.announcements.length} announcements`,
      eventsCount: updates.events.length,
      announcementsCount: updates.announcements.length,
    };
  } catch (error) {
    console.error('Error in manual fetch:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch IIT Dhanbad updates',
      error
    );
  }
});

/**
 * Simple HTTP endpoint for easy manual testing
 * Access via: http://localhost:5001/PROJECT-ID/us-central1/triggerFetch
 */
export const triggerFetch = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (_req, res) => {
    console.log('Manual fetch triggered via HTTP');

    try {
      const updates = await fetchIITDhanbadUpdates();

      console.log(`Fetched ${updates.events.length} events and ${updates.announcements.length} announcements`);

      await storeEvents(updates.events);
      await storeAnnouncements(updates.announcements);

      res.status(200).json({
        success: true,
        message: `Successfully fetched and stored ${updates.events.length} events and ${updates.announcements.length} announcements`,
        eventsCount: updates.events.length,
        announcementsCount: updates.announcements.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in manual fetch:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
