/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

// File Upload Constants
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Retry Logic Constants
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = 1000;
export const ACTIVITY_LOG_MAX_RETRIES = 2;
export const ACTIVITY_LOG_RETRY_DELAY_MS = 500;

// Firestore Query Limits
export const MAX_RECENT_DOWNLOADS = 10;
export const MAX_ACTIVITIES_STORED = 30; // Maximum number of activities to keep in database

// Firebase Storage Paths
export const PROFILE_PICTURES_PATH = 'profile_pictures';

// Domain Restrictions - Configurable per tenant via environment variables
// Falls back to IIT(ISM) Dhanbad for backward compatibility
export const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
export const HOSTED_DOMAIN = import.meta.env.VITE_HOSTED_DOMAIN;
