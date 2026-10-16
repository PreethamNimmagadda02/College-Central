/**
 * General helper functions
 */

import { GREETING_TIMES } from '@config/appConstants';

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): { emoji: string; text: string } => {
  const hour = new Date().getHours();
  if (hour < GREETING_TIMES.MORNING_END) return { emoji: '🌅', text: 'Good Morning' };
  if (hour < GREETING_TIMES.AFTERNOON_END) return { emoji: '☀️', text: 'Good Afternoon' };
  return { emoji: '🌆', text: 'Good Evening' };
};

/**
 * Get a random item from an array
 */
export const getRandomItem = <T>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)]!;
};
