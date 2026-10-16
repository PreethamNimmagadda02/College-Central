import { LogoIcon } from '@components/icons/SidebarIcons';
import { useAppConfig } from '@contexts/AppConfigContext';
import React from 'react';
import { Link } from 'react-router-dom';

const QUICK_LINKS: { label: string; to?: string; href?: string }[] = [
  { label: 'Academic Grades', to: '/grades' },
  { label: 'Class Schedule', to: '/schedule' },
  {
    label: 'Documentation',
    href: 'https://drive.google.com/file/d/1LZ4T36ZMcFypJy2l5-PBNkn4fZpXVsfX/view?usp=sharing',
  },
  { label: 'Feedback Form', href: 'https://forms.gle/kep4VdMWhXJ9879z6' },
];

const quickLinkClass =
  'group text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2';

const quickLinkBullet = (
  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"></span>
);

const Footer: React.FC = () => {
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const { config: appConfig } = useAppConfig();

  return (
    <footer
      className="relative bg-gradient-to-b from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/80 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 mt-auto overflow-hidden will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

      {/* Animated background accents */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Footer Content */}
        <div className="py-4 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {/* Brand Section */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                    <LogoIcon className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-blue-500 transition-all duration-300">
                    College Central
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {appConfig?.collegeInfo?.name?.short}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left max-w-xs leading-relaxed">
                Your comprehensive campus companion for academics, schedules, and campus life.
              </p>
            </div>

            {/* Quick Links Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Quick Links
                </h4>
              </div>
              <nav className="flex flex-col gap-2">
                {QUICK_LINKS.map(({ label, to, href }) =>
                  to ? (
                    <Link key={label} to={to} className={quickLinkClass}>
                      {quickLinkBullet}
                      {label}
                    </Link>
                  ) : (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={quickLinkClass}
                    >
                      {quickLinkBullet}
                      {label}
                      <svg
                        className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )
                )}
              </nav>
            </div>

            {/* Connect Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-600 rounded-full"></div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Connect
                </h4>
              </div>
              <div className="flex gap-3 mb-3">
                <a
                  href="mailto:collegecentral01@gmail.com"
                  className="group relative p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white dark:hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-red-500/50 overflow-hidden"
                  aria-label="Gmail"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="2"
                      className="group-hover:fill-white/10 transition-all duration-300"
                    />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center md:text-left font-medium">
                  Built with passion for the {appConfig?.collegeInfo?.name?.abbreviation} community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-slate-200/60 dark:border-slate-800/60 py-4">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
              © {currentYear}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                College Central
              </span>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs">
              <Link
                to="/privacy"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Privacy Policy</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                to="/terms"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Terms of Service</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href="mailto:collegecentral01@gmail.com"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden inline-flex items-center gap-1"
              >
                <span className="relative z-10">Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
