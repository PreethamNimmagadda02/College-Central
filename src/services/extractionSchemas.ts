/**
 * AI extraction config for academic calendar events (used by the admin calendar uploader)
 */

import { ExtractionConfig, ExtractionSchema } from './aiExtractionWorkflow';

interface CalendarEventData {
  date: string;
  endDate?: string;
  description: string;
  type: 'Start of Semester' | 'Mid-Semester Exams' | 'End-Semester Exams' | 'Holiday' | 'Other';
}

const calendarSchema: ExtractionSchema = {
  name: 'Academic Calendar Events',
  description: 'Events from an academic calendar including holidays, exams, and semester dates',
  fields: [
    { name: 'date', type: 'date', description: 'Start date in YYYY-MM-DD format', required: true },
    {
      name: 'endDate',
      type: 'date',
      description: 'End date in YYYY-MM-DD format (for multi-day events only)',
      required: false,
    },
    {
      name: 'description',
      type: 'string',
      description: 'Event name/title WITHOUT any dates',
      required: true,
    },
    { name: 'type', type: 'string', description: 'Event type classification', required: true },
  ],
  examples: `[
  {"date": "2025-07-01", "endDate": "2025-07-10", "description": "Pre-Registration for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-11", "endDate": "2025-07-15", "description": "Fee Payment for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-16", "endDate": "2025-07-20", "description": "Registration for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-24", "description": "Commencement of Monsoon Semester classes", "type": "Start of Semester"},
  {"date": "2025-08-15", "description": "Independence Day", "type": "Holiday"},
  {"date": "2025-10-02", "description": "Gandhi Jayanti", "type": "Holiday"},
  {"date": "2025-09-16", "endDate": "2025-09-21", "description": "Mid Semester Examination", "type": "Mid-Semester Exams"}
]

CONSECUTIVE EVENTS - CRITICAL:
When you see CONSECUTIVE events in the source (one after another), extract EACH as a SEPARATE entry:
- Event 1 with its own date(s) and description
- Event 2 with its own date(s) and description  
- Event 3 with its own date(s) and description
- etc.

Example from source: "1-10 July: Pre-Registration, 11-15 July: Fee Payment, 16-20 July: Registration"
Correct extraction:
- {"date": "2025-07-01", "endDate": "2025-07-10", "description": "Pre-Registration"}
- {"date": "2025-07-11", "endDate": "2025-07-15", "description": "Fee Payment"}
- {"date": "2025-07-16", "endDate": "2025-07-20", "description": "Registration"}

TABLE/LIST PARSING - CRITICAL:
- Each ROW in a table is typically a SEPARATE event
- Each BULLET POINT is typically a SEPARATE event
- Look for date patterns like "1-10", "11-15", "16-20" - these are DIFFERENT date ranges for DIFFERENT events
- If dates are consecutive but different, they are DIFFERENT events

DO NOT:
- Combine multiple events into one
- Use the same date for different events
- Skip any events
- Call pre-registration "Commencement of classes" - they are DIFFERENT events

EVENT NAMING:
- Use the EXACT name shown next to each date, not a nearby heading
- "Pre-Registration" and "Registration" are DIFFERENT from "Commencement of classes"
- "Commencement of classes" means actual start of teaching, NOT registration
- For holidays like Holi, Diwali, etc - just use the holiday name, not "on account of X"`,
  classificationRules: `CLASSIFICATION BY KEYWORDS:
- "Holiday", "on account of", festivals, breaks, vacations, Jayanti, Purnima, Diwali, Holi, Eid, Christmas → "Holiday"
- "Mid" + "exam" or "Mid-semester" + "exam" → "Mid-Semester Exams"
- "End" + "exam" or "End-semester" + "exam" → "End-Semester Exams"
- "Commencement of classes" or "Classes begin" → "Start of Semester" (NOT registration!)
- Pre-registration, Registration, Enrollment, Fee Payment → "Other"
- Everything else → "Other"`,
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = [
  'Start of Semester',
  'Mid-Semester Exams',
  'End-Semester Exams',
  'Holiday',
  'Other',
];

function isCalendarEvent(item: unknown): item is CalendarEventData {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  return (
    typeof obj.date === 'string' &&
    DATE_REGEX.test(obj.date) &&
    typeof obj.description === 'string' &&
    obj.description.length > 0 &&
    typeof obj.type === 'string'
  );
}

function normalizeCalendarEvent(item: CalendarEventData): CalendarEventData {
  let description = item.description.trim();

  // Extract the holiday name from "on account of X" pattern
  const onAccountMatch = description.match(/on account of\s+(.+)/i);
  if (onAccountMatch && onAccountMatch[1]) {
    description = onAccountMatch[1].trim();
  }

  // Remove "(Tentative)" or "(Confirmed)" suffixes but keep the main name
  description = description
    .replace(/\s*\(tentative\)/gi, '')
    .replace(/\s*\(confirmed\)/gi, '')
    .trim();

  // Strip dates from description
  description = stripDatesFromDescription(description);

  return {
    date: item.date,
    endDate:
      item.endDate && DATE_REGEX.test(item.endDate) && item.endDate !== item.date
        ? item.endDate
        : undefined,
    description,
    type: VALID_TYPES.includes(item.type) ? item.type : 'Other',
  };
}

/**
 * Remove date patterns from description text
 */
function stripDatesFromDescription(desc: string): string {
  return (
    desc
      // Remove patterns like "21 July, 2025" or "21st July 2025"
      .replace(
        /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}/gi,
        ''
      )
      // Remove patterns like "21-07-2025" or "21/07/2025"
      .replace(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g, '')
      // Remove patterns like "2025-07-21"
      .replace(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g, '')
      // Remove date ranges like "16 - 21 September"
      .replace(
        /\d{1,2}\s*[-–]\s*\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        ''
      )
      // Clean up extra spaces and punctuation
      .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function getCalendarEventKey(item: CalendarEventData): string {
  // Normalize description for comparison - remove filler words and common variations
  const normDesc = item.description
    .toLowerCase()
    // Remove common filler phrases
    .replace(/on account of/gi, '')
    .replace(/\(tentative\)/gi, '')
    .replace(/\(confirmed\)/gi, '')
    // Remove year references
    .replace(/\d{4}(-\d{2,4})?/g, '')
    // Remove common words that don't add meaning
    .replace(/semester|winter|monsoon|spring|autumn|for|the|of/gi, '')
    // Remove special characters and extra spaces
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Use just the start date for comparison (same date = likely same event)
  return `${item.date}|${normDesc}`;
}

export const calendarExtractionConfig: ExtractionConfig<CalendarEventData> = {
  schema: calendarSchema,
  validate: isCalendarEvent,
  normalize: normalizeCalendarEvent,
  getDedupeKey: getCalendarEventKey,
  maxChunkSize: 4000,
  chunkOverlap: 200,
  maxRetries: 3,
};
