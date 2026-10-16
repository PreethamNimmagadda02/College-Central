/**
 * College Information Configuration
 *
 * This file contains college-specific information that administrators can customize.
 * Only college/institution information should be stored here.
 */

export const COLLEGE_INFO = {
  // College Names
  name: {
    full: 'Indian Institute of Technology (Indian School of Mines) Dhanbad',
    short: 'IIT(ISM) Dhanbad',
    abbreviation: 'IIT(ISM)',
  },

  // Contact & Web
  email: {
    domain: 'iitism.ac.in',
    // Used for login validation - only emails from this domain will be allowed
    allowedDomain: '@iitism.ac.in',
  },

  website: {
    url: 'https://www.iitism.ac.in/',
    name: 'IIT(ISM) Website',
  },

  // Location
  location: {
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
  },
} as const;
