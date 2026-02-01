import { CalendarEvent } from '@/types';

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
