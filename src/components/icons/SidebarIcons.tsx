import {
  Archive,
  BookOpen,
  Bookmark,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Cloud,
  Code,
  Database,
  FileDown,
  FileIcon,
  FileText,
  Film,
  FlaskConical,
  Globe,
  GraduationCap,
  Heart,
  House,
  ImageIcon,
  LogOut,
  MapPin,
  MessagesSquare,
  Moon,
  Music,
  Newspaper,
  Presentation,
  Puzzle,
  Receipt,
  ShoppingBag,
  Sun,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

const iconClass = 'w-5 h-5';
const smallIconClass = 'w-4 h-4';
const quickLinkIconClass = 'w-5 h-5 shrink-0';

// Keeps the old default sizes so call sites can keep rendering `<DashboardIcon />`.
function sized(Icon: LucideIcon, defaultClass: string) {
  return function SizedIcon({ className = defaultClass }: { className?: string }) {
    return <Icon className={className} />;
  };
}

export const DashboardIcon = sized(House, iconClass);
export const GradesIcon = sized(FileText, iconClass);
export const ScheduleIcon = sized(Calendar, iconClass);
export const DirectoryIcon = sized(Users, iconClass);
export const ProfileIcon = sized(User, iconClass);
export const LogoutIcon = sized(LogOut, iconClass);
export const FormsIcon = sized(FileDown, iconClass);
export const CalendarIcon = sized(CalendarDays, iconClass);

export const InstructorIcon = sized(User, smallIconClass);
export const LocationIcon = sized(MapPin, smallIconClass);
export const CalendarCheckIcon = sized(CalendarCheck, smallIconClass);

export const LibraryIcon = sized(BookOpen, quickLinkIconClass);
export const HealthIcon = sized(Heart, quickLinkIconClass);
export const FeeIcon = sized(Receipt, quickLinkIconClass);
export const WebsiteIcon = sized(Globe, quickLinkIconClass);
export const CdcIcon = sized(Archive, quickLinkIconClass);
export const ScholarshipIcon = sized(GraduationCap, quickLinkIconClass);
export const MisIcon = sized(Presentation, quickLinkIconClass);
export const AbhikalpIcon = sized(FlaskConical, quickLinkIconClass);
export const ArkIcon = sized(Database, quickLinkIconClass);
export const MapIcon = sized(MapPin, quickLinkIconClass);
export const CloudIcon = sized(Cloud, quickLinkIconClass);
export const VideoIcon = sized(Film, quickLinkIconClass);
export const CodeIcon = sized(Code, quickLinkIconClass);
export const ChatIcon = sized(MessagesSquare, quickLinkIconClass);
export const DocumentIcon = sized(FileIcon, quickLinkIconClass);
export const MusicIcon = sized(Music, quickLinkIconClass);
export const ShoppingIcon = sized(ShoppingBag, quickLinkIconClass);
export const PhotoIcon = sized(ImageIcon, quickLinkIconClass);
export const CalculatorIcon = sized(Calculator, quickLinkIconClass);
export const GameIcon = sized(Puzzle, quickLinkIconClass);
export const BookmarkIcon = sized(Bookmark, quickLinkIconClass);
export const NewspaperIcon = sized(Newspaper, quickLinkIconClass);

export const SunIcon = Sun;
export const MoonIcon = Moon;

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20M1 12l5.373 2.846M23 12l-5.373 2.846"
    />
  </svg>
);
