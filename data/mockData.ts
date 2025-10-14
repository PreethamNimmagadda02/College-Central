import {
  LostFoundItem,
  LostFoundStatus,
} from '../types';

// MOCK_USER, MOCK_GRADES, MOCK_SCHEDULE are now obsolete and managed in Firestore.

// Kept for the un-migrated Lost & Found page.
export const MOCK_LOST_AND_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: 'lf1',
    name: 'Lost: Black Dell Laptop Charger',
    description: 'A standard Dell 65W laptop charger, black color. Last seen near the library charging ports.',
    lastSeenLocation: 'Central Library',
    date: 'Oct 25, 2024',
    reporterName: 'Rohan Sharma',
    reporterContact: 'rohan_21je0789@student.iitism.ac.in',
    status: LostFoundStatus.Lost,
    imageUrl: 'https://picsum.photos/seed/laptopcharger/400/200'
  },
  {
    id: 'lf2',
    name: 'Found: A pair of spectacles',
    description: 'Found a pair of black-rimmed spectacles near the Oval Garden benches.',
    lastSeenLocation: 'Oval Garden',
    date: 'Oct 24, 2024',
    reporterName: 'Priya Singh',
    reporterContact: 'Contact Security Office',
    status: LostFoundStatus.Found,
    imageUrl: 'https://picsum.photos/seed/spectacles/400/200'
  },
];
