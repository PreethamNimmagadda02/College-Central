import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CampusLocation, QuickRoute } from '../types';
import { useAuth } from '../hooks/useAuth';

interface CampusMapContextType {
  locations: CampusLocation[];
  quickRoutes: QuickRoute[];
  loading: boolean;
  error: string | null;
  savedPlaces: string[];
  toggleSavePlace: (locationId: string) => Promise<void>;
  getDirections: (from: string, to: string) => string;
  shareLocation: (locationId: string) => Promise<void>;
}

const CampusMapContext = createContext<CampusMapContextType | undefined>(undefined);

// Authentic IIT (ISM) Dhanbad campus locations data
// Campus Center: 23.8080°N, 86.4385°E (verified from official sources)
const defaultLocations: CampusLocation[] = [
  // Academic Buildings
  {
    id: 'loc-1',
    name: 'Main Building',
    category: 'academic',
    coordinates: { lat: 23.814056965821766, lng: 86.44140298965519 },
    description: 'Central administrative hub with Director\'s office and administrative departments',
    icon: '🏛️',
    details: {
      address: 'Main Campus, IIT (ISM) Dhanbad',
      openingHours: '9:00 AM - 5:00 PM',
      facilities: ['Director Office', 'Registrar Office', 'Administrative Departments']
    }
  },
  {
    id: 'loc-2',
    name: 'New Academic Complex (NAC)',
    category: 'academic',
    coordinates: { lat: 23.811444806854503, lng: 86.44071604183705 },
    description: 'New academic complex with modern classrooms and labs',
    icon: '🏛️',
    details: {
      openingHours: '9:00 AM - 5:00 PM',
      facilities: ['Classrooms', 'Labs', 'Conference Rooms']
    }
  },
  {
    id: 'loc-3',
    name: 'Central Library',
    category: 'academic',
    coordinates: { lat: 23.816044265938007, lng: 86.44224027740222 },
    description: 'Dr. B. R. Ambedkar Central Library with 24/7 access and vast collection',
    icon: '📚',
    details: {
      openingHours: '24/7',
      capacity: 500,
      facilities: ['Reading Halls', 'Digital Library', 'Research Section', 'Study Rooms']
    }
  },
  {
    id: 'loc-4',
    name: 'New Lecture Hall Complex (NLHC)',
    category: 'academic',
    coordinates: { lat: 23.8163233904913, lng: 86.43943437987664 },
    description: 'Modern lecture halls with audio-visual equipment',
    icon: '🎓',
    details: {
      capacity: 1000,
      facilities: ['Lecture Halls', 'Seminar Rooms', 'Audio-Visual Equipment']
    }
  },
  {
    id: 'loc-5',
    name: 'Mining Engineering Department',
    category: 'academic',
    coordinates: { lat: 23.81444529665606, lng: 86.44096001580465 },
    description: 'Department of Mining Engineering with specialized labs',
    icon: '⛏️',
    details: {
      facilities: ['Mining Labs', 'Research Centers', 'Faculty Offices']
    }
  },
  {
    id: 'loc-6',
    name: 'Petroleum Engineering Department',
    category: 'academic',
    coordinates: { lat: 23.815552017325857, lng: 86.44299841404145 },
    description: 'Department of Petroleum Engineering',
    icon: '🛢️',
    details: {
      facilities: ['Petroleum Labs', 'Research Facilities']
    }
  },
  {
    id: 'loc-7',
    name: 'Computer Science & Engineering Department',
    category: 'academic',
    coordinates: { lat: 23.811871661226007, lng: 86.44089056436691 },
    description: 'CSE Department with modern labs and facilities',
    icon: '💾',
    details: {
      facilities: ['Programming Labs', 'AI/ML Labs', 'Research Labs']
    }
  },

  // Residential - Boys Hostels
  {
    id: 'loc-8',
    name: 'Amber Hostel',
    category: 'residential',
    coordinates: { lat: 23.818204010173783, lng: 86.43928300148485 },
    description: 'Boys hostel with modern amenities',
    icon: '🏠',
    details: {
      capacity: 400,
      facilities: ['Common Room', 'Mess', 'Gym', 'Reading Room']
    }
  },
  {
    id: 'loc-9',
    name: 'Diamond Hostel',
    category: 'residential',
    coordinates: { lat: 23.815405073245113, lng: 86.44052525494638 },
    description: 'Boys hostel with excellent facilities',
    icon: '🏠',
    details: {
      capacity: 450,
      facilities: ['Common Room', 'Mess', 'Sports Room', 'Study Area']
    }
  },
  {
    id: 'loc-10',
    name: 'Emerald Hostel',
    category: 'residential',
    coordinates: { lat: 23.816961914786837, lng: 86.43968670862577 },
    description: 'Boys hostel with sports facilities',
    icon: '🏠',
    details: {
      capacity: 400,
      facilities: ['Common Room', 'Mess', 'Indoor Games', 'Library']
    }
  },
  {
    id: 'loc-11',
    name: 'Topaz Hostel',
    category: 'residential',
    coordinates: { lat: 23.81866309411284, lng: 86.4379461792489 },
    description: 'Boys hostel',
    icon: '🏠',
    details: {
      capacity: 350,
      facilities: ['Common Room', 'Mess', 'Recreation Room']
    }
  },
  {
    id: 'loc-12',
    name: 'Jasper Hostel',
    category: 'residential',
    coordinates: { lat: 23.817188, lng: 86.440906 },
    description: 'Boys hostel with modern infrastructure',
    icon: '🏠',
    details: {
      capacity: 380,
      facilities: ['Common Room', 'Mess', 'Gym']
    }
  },

  // Residential - Girls Hostels
  {
    id: 'loc-13',
    name: 'Ruby and Rosaline Hostel',
    category: 'residential',
    coordinates: { lat: 23.81326225953706, lng: 86.44598315019829 },
    description: 'Girls hostel with secure and comfortable living',
    icon: '🏠',
    details: {
      capacity: 300,
      facilities: ['Common Room', 'Mess', 'Reading Room', 'Recreation Area']
    }
  },
  {
    id: 'loc-14',
    name: 'Opal Hostel',
    category: 'residential',
    coordinates: { lat: 23.815619610213233, lng: 86.44141400947353 },
    description: 'Girls hostel with modern amenities',
    icon: '🏠',
    details: {
      capacity: 250,
      facilities: ['Common Room', 'Mess', 'Study Room', 'Gym']
    }
  },
  {
    id: 'loc-15',
    name: 'Faculty Quarters',
    category: 'residential',
    coordinates: { lat: 23.811219070425473, lng: 86.43941026950026 },
    description: 'Residential area for faculty members',
    icon: '🏘️',
    details: {
      facilities: ['Houses', 'Parks', 'Community Center']
    }
  },

  // Facilities
  {
    id: 'loc-16',
    name: 'Student Activity Centre (SAC)',
    category: 'facilities',
    coordinates: { lat: 23.817397708590402, lng: 86.437598586991 },
    description: 'Hub for clubs, cultural events, and student activities',
    icon: '🎯',
    details: {
      openingHours: '8:00 AM - 10:00 PM',
      facilities: ['Club Rooms', 'Event Halls', 'Music Room', 'Dance Studio', 'Art Room']
    }
  },
  {
    id: 'loc-17',
    name: 'Health Centre',
    category: 'facilities',
    coordinates: { lat: 23.812013163024574, lng: 86.43905150257838 },
    description: '24/7 medical facilities with doctors and ambulance service',
    icon: '🏥',
    details: {
      openingHours: '24/7',
      contact: '0326-223-5435',
      facilities: ['Emergency Care', 'OPD', 'Pharmacy', 'Ambulance Service']
    }
  },
  {
    id: 'loc-18',
    name: 'Lower Ground',
    category: 'facilities',
    coordinates: { lat: 23.8130345249551, lng: 86.44257130965305 },
    description: 'Indoor and outdoor sports facilities including cricket, football, basketball',
    icon: '⚽',
    details: {
      openingHours: '6:00 AM - 9:00 PM',
      facilities: ['Cricket Ground', 'Football Field', 'Basketball Courts', 'Badminton Courts', 'Gym', 'Swimming Pool']
    }
  },
  {
    id: 'loc-19',
    name: 'Penman Auditorium',
    category: 'facilities',
    coordinates: { lat: 23.814945323310198, lng: 86.44121915155911},
    description: 'Main auditorium for cultural events, fests, and convocations',
    icon: '🎭',
    details: {
      capacity: 800,
      facilities: ['Main Stage', 'Audio-Visual Equipment', 'Green Rooms', 'Air Conditioning']
    }
  },
  {
    id: 'loc-20',
    name: 'Mini Mart',
    category: 'facilities',
    coordinates: { lat: 23.813366718936496, lng: 86.4444272116073 },
    description: 'Campus shopping area with stationery, xerox, and daily necessities',
    icon: '🛍️',
    details: {
      openingHours: '8:00 AM - 10:00 PM',
      facilities: ['Stationery Shops', 'Xerox Center', 'General Stores', 'Salons']
    }
  },
  {
    id: 'loc-21',
    name: 'EDC',
    category: 'facilities',
    coordinates: { lat: 23.81209156272351, lng: 86.44142464539605 },
    description: 'Guest house for visitors and parents',
    icon: '🏨',
    details: {
      facilities: ['Rooms', 'Dining', 'Conference Hall']
    }
  },
  {
    id: 'loc-22',
    name: 'Post Office',
    category: 'facilities',
    coordinates: { lat: 23.81133275693239, lng: 86.4421967359506 },
    description: 'Campus post office',
    icon: '📮',
    details: {
      openingHours: '10:00 AM - 5:00 PM (Mon-Sat)',
      facilities: ['Mail Services', 'Banking Services']
    }
  },

  // Dining
  {
    id: 'loc-23',
    name: 'Barista',
    category: 'dining',
    coordinates: { lat: 23.815733183483914, lng: 86.44238372595758 },
    description: 'Multi-cuisine restaurant for students and staff',
    icon: '🍽️',
    details: {
      openingHours: '8:00 AM - 10:00 PM',
      facilities: ['AC Dining', 'Multiple Cuisines', 'Snacks Corner']
    }
  },
  {
    id: 'loc-24',
    name: 'Ram Dhani(RD)',
    category: 'dining',
    coordinates: { lat: 23.81637680266684, lng: 86.44028477410735 },
    description: 'Quick bites, beverages, and snacks',
    icon: '☕',
    details: {
      openingHours: '9:00 AM - 8:00 PM',
      facilities: ['Tea/Coffee', 'Snacks', 'Fast Food']
    }
  },
  {
    id: 'loc-25',
    name: 'Main Canteen',
    category: 'dining',
    coordinates: { lat: 23.815097214988214, lng: 86.44156969502028 },
    description: 'Various food stalls with different cuisines',
    icon: '🍔',
    details: {
      openingHours: '11:00 AM - 10:00 PM',
      facilities: ['Multiple Stalls', 'Fast Food', 'Regional Cuisine']
    }
  },
  {
    id: 'loc-26',
    name: 'Mezbaan',
    category: 'dining',
    coordinates: { lat: 23.81606348290681, lng: 86.44242350189195 },
    description: 'Main mess facility for hostel students',
    icon: '🍱',
    details: {
      openingHours: 'Breakfast: 7-9 AM, Lunch: 12-2 PM, Dinner: 7-10 PM',
      facilities: ['Mess Halls', 'Meal Plans']
    }
  },
  {
    id: 'loc-27',
    name: 'Dominos Pizza',
    category: 'dining',
    coordinates: { lat: 23.8162183687907, lng: 86.44201554359145 },
    description: 'Late night snacks and beverages for students',
    icon: '🌙',
    details: {
      openingHours: '10:00 PM - 2:00 AM',
      facilities: ['Snacks', 'Tea/Coffee', 'Maggi Point']
    }
  },
];

const defaultQuickRoutes: QuickRoute[] = [
  {
    id: 'route-1',
    from: 'Main Building',
    to: 'Central Library',
    time: '3 min walk',
    distance: '250m',
    steps: ['Exit Main Building', 'Walk on Academic Road', 'Central Library on right']
  },
  {
    id: 'route-2',
    from: 'Amber Hostel',
    to: 'New Lecture Hall Complex (NLHC)',
    time: '4 min walk',
    distance: '300m',
    steps: ['Exit hostel', 'Walk towards academic area', 'NLHC ahead']
  },
  {
    id: 'route-3',
    from: 'Central Library',
    to: 'Computer Science & Engineering Department',
    time: '5 min walk',
    distance: '400m',
    steps: ['Exit Library', 'Walk on Academic Road', 'CSE Department on right']
  },
  {
    id: 'route-4',
    from: 'Student Activity Centre (SAC)',
    to: 'Lower Ground',
    time: '5 min walk',
    distance: '450m',
    steps: ['Exit SAC', 'Walk towards sports area', 'Lower Ground ahead']
  },
  {
    id: 'route-5',
    from: 'Main Building',
    to: 'Barista',
    time: '3 min walk',
    distance: '250m',
    steps: ['Exit Main Building', 'Walk towards dining area', 'Barista on left']
  },
]; 

export const CampusMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [locations] = useState<CampusLocation[]>(defaultLocations);
  const [quickRoutes] = useState<QuickRoute[]>(defaultQuickRoutes);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX: Add error state to provider.
  const [error, setError] = useState<string | null>(null);

  // Load user's saved places from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Load user's saved places
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnap) => {
        // FIX: Safely access 'savedCampusPlaces' property from document snapshot data.
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.savedCampusPlaces) {
            setSavedPlaces(data.savedCampusPlaces as string[]);
          } else {
            setSavedPlaces([]);
          }
        } else {
          setSavedPlaces([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading saved places:', err);
        // FIX: Set error state on failure.
        setError('Failed to load saved places.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Toggle saved place (sync with Firebase)
  const toggleSavePlace = async (locationId: string) => {
    if (!currentUser) {
      console.error('User must be logged in to save places');
      return;
    }

    const newSaved = savedPlaces.includes(locationId)
      ? savedPlaces.filter((id: string) => id !== locationId)
      : [...savedPlaces, locationId];

    setSavedPlaces(newSaved);

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        savedCampusPlaces: newSaved
      });
    } catch (err) {
      console.error('Error saving place:', err);
      // Revert on error
      setSavedPlaces(savedPlaces);
    }
  };

  // Get directions URL for Google Maps
  const getDirections = (from: string, to: string): string => {
    const fromLoc = locations.find((loc: CampusLocation) => loc.name === from);
    const toLoc = locations.find((loc: CampusLocation) => loc.name === to);

    if (fromLoc && toLoc) {
      const origin = `${fromLoc.coordinates.lat},${fromLoc.coordinates.lng}`;
      const destination = `${toLoc.coordinates.lat},${toLoc.coordinates.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    }

    return `https://www.google.com/maps/search/?api=1&query=IIT+ISM+Dhanbad`;
  };

  // Share location
  const shareLocation = async (locationId: string) => {
    const location = locations.find((loc: CampusLocation) => loc.id === locationId);
    if (!location) return;

    const shareData = {
      title: location.name,
      text: `${location.name} - ${location.description}\n\nIIT (ISM) Dhanbad Campus`,
      url: `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        alert('Location details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return ( 
    <CampusMapContext.Provider
      value={{
        locations,
        quickRoutes,
        loading,
        error,
        savedPlaces,
        toggleSavePlace,
        getDirections,
        shareLocation,
      }}
    >
      {children}
    </CampusMapContext.Provider>
  );
};

export const useCampusMap = () => {
  const context = useContext(CampusMapContext);
  if (context === undefined) {
    throw new Error('useCampusMap must be used within a CampusMapProvider');
  }
  return context;
};