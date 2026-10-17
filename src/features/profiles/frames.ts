// Avatar frames and initials shared by the profile page and the public profile
export const FRAME_OPTIONS = [
  { id: 'none', name: 'None', class: 'ring-4 ring-white/50 rounded-full' },
  {
    id: 'gradient-blue',
    name: 'Ocean',
    class:
      'p-1 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 rounded-full',
  },
  {
    id: 'gradient-purple',
    name: 'Nebula',
    class:
      'p-1 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-500 shadow-lg shadow-purple-500/30 rounded-full',
  },
  {
    id: 'gradient-gold',
    name: 'Gold',
    class:
      'p-1 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 shadow-lg shadow-yellow-500/40 border border-yellow-300 rounded-full',
  },
  {
    id: 'neon-green',
    name: 'Cyber',
    class: 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] bg-black rounded-full',
  },
  {
    id: 'royal',
    name: 'Royal',
    class:
      'p-1 bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-700 shadow-xl border border-yellow-600 rounded-full',
  },
  {
    id: 'holographic',
    name: 'Holo',
    class:
      'p-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-[length:200%_200%] animate-gradient-shift shadow-lg rounded-full',
  },
  {
    id: 'neon-blue',
    name: 'Tron',
    class: 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] bg-slate-900 rounded-full',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    class: 'ring-1 ring-white/80 offset-4 offset-black rounded-full',
  },
];

// An unset or unknown frame falls back to `fallback`
export const getFrameClass = (frameId?: string, fallback = 'ring-4 ring-white/50 rounded-full') =>
  FRAME_OPTIONS.find((f) => f.id === frameId)?.class ?? fallback;

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
