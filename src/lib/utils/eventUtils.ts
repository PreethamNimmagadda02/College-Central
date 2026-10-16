import { CalendarEvent } from '@/types';

// Unique key for an event; reminder preferences are stored under this key
export const getEventKey = (event: CalendarEvent): string => `${event.date}-${event.description}`;

const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Events that are ongoing or start within the next week, soonest first
export const getUpcomingEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const today = startOfToday();
  const oneWeekFromToday = new Date(today);
  oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);

  return events
    .filter((event) => {
      const eventStartDate = new Date(event.date);
      const eventEndDate = new Date(event.endDate || event.date);
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      const isOngoing = eventStartDate < today && eventEndDate >= today;
      const isUpcomingThisWeek = eventStartDate >= today && eventStartDate <= oneWeekFromToday;
      return isOngoing || isUpcomingThisWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Up to 3 not-yet-past events the user set reminders for, soonest first
export const getCountdownEvents = (
  events: CalendarEvent[],
  reminderKeys: string[]
): CalendarEvent[] => {
  const today = startOfToday();

  return reminderKeys
    .map((key) => events.find((e) => getEventKey(e) === key))
    .filter((e): e is CalendarEvent => {
      if (!e) return false;
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
};

// Helper function to get emoji for calendar event type
export const getEventEmoji = (event: CalendarEvent): string => {
  const desc = event.description.toLowerCase();
  const type = event.type;

  // Check event type first
  if (type === 'Mid-Semester Exams' || type === 'End-Semester Exams') {
    return '📝';
  }
  if (type === 'Start of Semester') {
    return '🎓';
  }
  if (type === 'Holiday') {
    // Check for specific holidays
    if (desc.includes('diwali') || desc.includes('deepavali')) return '🪔';
    if (desc.includes('holi')) return '🎨';
    if (desc.includes('christmas')) return '🎄';
    if (desc.includes('new year')) return '🎊';
    if (desc.includes('independence') || desc.includes('republic')) return '🇮🇳';
    if (desc.includes('dussehra') || desc.includes('durga')) return '🙏';
    if (desc.includes('eid')) return '🌙';
    if (desc.includes('gandhi')) return '🕊️';
    return '🎉';
  }

  // Check description for specific keywords
  if (desc.includes('exam') || desc.includes('test')) return '📝';
  if (desc.includes('registration') || desc.includes('enroll')) return '📋';
  if (desc.includes('vacation') || desc.includes('break')) return '🏖️';
  if (desc.includes('convocation') || desc.includes('graduation')) return '🎓';
  if (desc.includes('orientation')) return '🧭';
  if (desc.includes('sports') || desc.includes('athletics')) return '🏆';
  if (desc.includes('cultural') || desc.includes('fest')) return '🎭';
  if (desc.includes('technical') || desc.includes('hackathon')) return '💻';
  if (desc.includes('workshop') || desc.includes('seminar')) return '📚';
  if (desc.includes('deadline') || desc.includes('submission')) return '⏰';
  if (desc.includes('meeting')) return '👥';
  if (desc.includes('timetable') || desc.includes('schedule')) return '📅';

  // Default based on type
  return '📌';
};
