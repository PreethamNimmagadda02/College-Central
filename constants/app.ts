/**
 * Application-wide constants
 */

// Time intervals (in milliseconds)
export const TIME_INTERVALS = {
  DAY_CHECK: 60000, // 1 minute
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Greeting time thresholds (hours)
export const GREETING_TIMES = {
  MORNING_END: 12,
  AFTERNOON_END: 17,
} as const;

// Semester defaults
export const SEMESTER_DEFAULTS = {
  START_MONTH: 0, // January
  START_DAY: 15,
  END_MONTH: 4, // May
  END_DAY: 15,
} as const;

// UI Constants
export const UI = {
  MAX_LOADING_HEIGHT: 'calc(100vh-10rem)',
  LOADER_SIZE: {
    SMALL: 'w-8 h-8',
    MEDIUM: 'w-12 h-12',
    LARGE: 'w-16 h-16',
  },
} as const;

// Weather API
export const WEATHER = {
  DHANBAD_LAT: 23.7879,
  DHANBAD_LON: 86.4304,
} as const;

// Motivational quotes
export const MOTIVATIONAL_QUOTES = [
  { text: "Arise, awake and stop not until the goal is reached", author: "Swami Vivekananda" },
  { text: "The future belongs to those who believe in the beauty of their dreams", author: "Eleanor Roosevelt" },
  { text: "Excellence is not a skill, it's an attitude", author: "Ralph Marston" },
  { text: "Success is the sum of small efforts repeated day in and day out", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going", author: "Sam Levenson" },
  { text: "Education is the most powerful weapon which you can use to change the world", author: "Nelson Mandela" },
  { text: "The expert in anything was once a beginner", author: "Helen Hayes" },
  { text: "Believe you can and you're halfway there", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do", author: "Steve Jobs" },
  { text: "Strive not to be a success, but rather to be of value", author: "Albert Einstein" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts", author: "Winston Churchill" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now", author: "Chinese Proverb" },
  { text: "Don't let yesterday take up too much of today", author: "Will Rogers" },
  { text: "You learn more from failure than from success. Don't let it stop you", author: "Anonymous" },
  { text: "It's not whether you get knocked down, it's whether you get up", author: "Vince Lombardi" },
  { text: "If you are working on something that you really care about, you don't have to be pushed", author: "Steve Jobs" },
  { text: "People who are crazy enough to think they can change the world, are the ones who do", author: "Rob Siltanen" },
  { text: "Failure will never overtake me if my determination to succeed is strong enough", author: "Og Mandino" },
  { text: "We may encounter many defeats but we must not be defeated", author: "Maya Angelou" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do", author: "Johann Wolfgang Von Goethe" },
  { text: "Whether you think you can or think you can't, you're right", author: "Henry Ford" },
  { text: "The secret of getting ahead is getting started", author: "Mark Twain" },
  { text: "I find that the harder I work, the more luck I seem to have", author: "Thomas Jefferson" },
  { text: "Don't be afraid to give up the good to go for the great", author: "John D. Rockefeller" },
  { text: "The mind is everything. What you think you become", author: "Buddha" },
  { text: "I have not failed. I've just found 10,000 ways that won't work", author: "Thomas Edison" },
  { text: "A person who never made a mistake never tried anything new", author: "Albert Einstein" },
  { text: "The only impossible journey is the one you never begin", author: "Tony Robbins" },
  { text: "In this life we cannot do great things. We can only do small things with great love", author: "Mother Teresa" },
  { text: "You are never too old to set another goal or to dream a new dream", author: "C.S. Lewis" },
  { text: "Try not to become a person of success, but rather try to become a person of value", author: "Albert Einstein" },
  { text: "Be not afraid of growing slowly; be afraid only of standing still", author: "Chinese Proverb" },
  { text: "Everything you've ever wanted is on the other side of fear", author: "George Addair" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm", author: "Winston Churchill" },
  { text: "The two most important days in your life are the day you are born and the day you find out why", author: "Mark Twain" },
  { text: "Whatever the mind of man can conceive and believe, it can achieve", author: "Napoleon Hill" },
  { text: "An investment in knowledge pays the best interest", author: "Benjamin Franklin" },
  { text: "The function of education is to teach one to think intensively and to think critically", author: "Martin Luther King Jr." }
] as const;
