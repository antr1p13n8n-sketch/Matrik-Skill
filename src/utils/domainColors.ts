import { SkillCategory } from '../types/skills';

export interface DomainColorTheme {
  dot: string;
  hex: string;
  pillActive: string;
  pillIdle: string;
  headerTint: string;
  barGradient: string;
  badge: string;
}

export const DOMAIN_COLOR_MAP: Record<SkillCategory, DomainColorTheme> = {
  cad_design: {
    dot: 'bg-sky-500',
    hex: '#0ea5e9',
    pillActive: 'bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-sm shadow-sky-500/25 border-transparent',
    pillIdle: 'text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-800/60 hover:bg-sky-100/80 dark:hover:bg-sky-900/50',
    headerTint: 'bg-sky-50/60 dark:bg-sky-950/20',
    barGradient: 'from-sky-500 via-cyan-500 to-teal-400',
    badge: 'bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  structural_fea: {
    dot: 'bg-indigo-500',
    hex: '#6366f1',
    pillActive: 'bg-linear-to-r from-indigo-500 to-blue-600 text-white shadow-sm shadow-indigo-500/25 border-transparent',
    pillIdle: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50',
    headerTint: 'bg-indigo-50/60 dark:bg-indigo-950/20',
    barGradient: 'from-indigo-500 via-blue-500 to-cyan-500',
    badge: 'bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  thermal_cfd: {
    dot: 'bg-orange-500',
    hex: '#f97316',
    pillActive: 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 border-transparent',
    pillIdle: 'text-orange-700 dark:text-orange-300 bg-orange-50/70 dark:bg-orange-950/30 border-orange-200/80 dark:border-orange-800/60 hover:bg-orange-100/80 dark:hover:bg-orange-900/50',
    headerTint: 'bg-orange-50/60 dark:bg-orange-950/20',
    barGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    badge: 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  materials_mfg: {
    dot: 'bg-emerald-500',
    hex: '#10b981',
    pillActive: 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/25 border-transparent',
    pillIdle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
    headerTint: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    barGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    badge: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  mechatronics: {
    dot: 'bg-fuchsia-500',
    hex: '#d946ef',
    pillActive: 'bg-linear-to-r from-fuchsia-500 to-pink-500 text-white shadow-sm shadow-fuchsia-500/25 border-transparent',
    pillIdle: 'text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border-fuchsia-200/80 dark:border-fuchsia-800/60 hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-900/50',
    headerTint: 'bg-fuchsia-50/60 dark:bg-fuchsia-950/20',
    barGradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
    badge: 'bg-fuchsia-100/80 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  },
  quality_reliability: {
    dot: 'bg-teal-500',
    hex: '#14b8a6',
    pillActive: 'bg-linear-to-r from-teal-500 to-cyan-600 text-white shadow-sm shadow-teal-500/25 border-transparent',
    pillIdle: 'text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-800/60 hover:bg-teal-100/80 dark:hover:bg-teal-900/50',
    headerTint: 'bg-teal-50/60 dark:bg-teal-950/20',
    barGradient: 'from-teal-500 via-emerald-500 to-green-500',
    badge: 'bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  standards_compliance: {
    dot: 'bg-violet-500',
    hex: '#8b5cf6',
    pillActive: 'bg-linear-to-r from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-500/25 border-transparent',
    pillIdle: 'text-violet-700 dark:text-violet-300 bg-violet-50/70 dark:bg-violet-950/30 border-violet-200/80 dark:border-violet-800/60 hover:bg-violet-100/80 dark:hover:bg-violet-900/50',
    headerTint: 'bg-violet-50/60 dark:bg-violet-950/20',
    barGradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    badge: 'bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
};

export const AVATAR_GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-purple-600',
];

export function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
