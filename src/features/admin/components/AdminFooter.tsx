import { useAppConfig } from '@contexts/AppConfigContext';
import { FileText, House, Mail, Settings } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/admin/analytics', label: 'Analytics Dashboard' },
  { to: '/admin/college-info', label: 'College Information' },
  { to: '/admin/directory', label: 'Faculty Directory' },
  { to: '/admin/students', label: 'Student Directory' },
];

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/admin/support', label: 'Support' },
];

const resourceBtn =
  'group relative p-2 sm:p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl overflow-hidden';
const resourceIcon =
  'w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:scale-110';

const AdminFooter: React.FC = () => {
  const { config: appConfig } = useAppConfig();
  const navigate = useNavigate();

  return (
    <footer className="relative bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 backdrop-blur-lg border-t border-slate-700/60 mt-auto overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>

      {/* Background accents - hidden on mobile for performance */}
      <div className="absolute inset-0 opacity-20 hidden sm:block">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="py-3 sm:py-4 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Brand Section */}
            <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start gap-3 sm:gap-4">
              <div
                className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
                onClick={() => navigate('/admin/college-info')}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-2 sm:p-2.5 rounded-xl shadow-lg group-hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-105">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-purple-300 transition-all duration-300">
                    College Central
                  </h3>
                  <p className="text-xs text-slate-400 font-medium group-hover:text-purple-400 transition-colors">
                    {appConfig?.collegeInfo?.name?.short}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 text-center sm:text-left max-w-xs leading-relaxed hidden sm:block">
                Manage college data, users, and content from this centralized dashboard.
              </p>
            </div>

            {/* Quick Links Section - hide on xs, show on sm+ */}
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Quick Links
                </h4>
              </div>
              <nav className="flex flex-col gap-1.5 sm:gap-2">
                {QUICK_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all"></span>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Resources Section - hide on xs, show on sm+ */}
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"></div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Resources
                </h4>
              </div>
              <div className="flex gap-2 sm:gap-3 mb-3">
                <a
                  href="mailto:collegecentral01@gmail.com"
                  className={`${resourceBtn} hover:shadow-purple-500/50`}
                  aria-label="Email Support"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Mail className={resourceIcon} />
                </a>
                <Link
                  to="/"
                  className={`${resourceBtn} hover:shadow-blue-500/50`}
                  aria-label="User Dashboard"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <House className={resourceIcon} />
                </Link>
                <a
                  href="https://drive.google.com/file/d/165efBK3Z0QPOoj7mpry-SzAoFZo-uHED/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${resourceBtn} hover:shadow-green-500/50`}
                  aria-label="Documentation"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FileText className={resourceIcon} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-slate-700/60 py-3 sm:py-4">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left font-medium">
              © {new Date().getFullYear()}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
                College Central
              </span>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-1 sm:gap-3 text-[10px] sm:text-xs">
              {LEGAL_LINKS.map(({ to, label }, i) => (
                <React.Fragment key={to}>
                  {i > 0 && <span className="text-slate-600 hidden sm:inline">•</span>}
                  <Link
                    to={to}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-slate-400 hover:text-purple-400 transition-all duration-200 hover:bg-slate-800"
                  >
                    {label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(AdminFooter);
