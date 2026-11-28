import React from 'react';

export const OrbitBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden select-none"
    >
      {/* Top-Right Orbital System (Aerospace & Competency Telemetry Rings) */}
      <div className="absolute -top-36 -right-36 w-[520px] h-[520px] sm:w-[620px] sm:h-[620px] flex items-center justify-center opacity-80 dark:opacity-90">
        {/* Outer soft core halo */}
        <div className="absolute w-52 h-52 rounded-full bg-linear-to-tr from-cyan-400/10 via-indigo-400/10 to-fuchsia-400/10 dark:from-cyan-500/12 dark:via-indigo-500/12 dark:to-fuchsia-500/12 blur-2xl" />

        {/* Orbit Ring 1 (Outer - 480px) */}
        <div
          className="absolute w-[460px] h-[460px] sm:w-[540px] sm:h-[540px] rounded-full border border-dashed border-cyan-500/20 dark:border-cyan-400/20 animate-orbit-cw"
          style={{ '--orbit-duration': '52s' } as React.CSSProperties}
        >
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-linear-to-br from-cyan-400 to-sky-500 shadow-[0_0_12px_rgba(6,182,212,0.65)]" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-linear-to-br from-indigo-400 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
        </div>

        {/* Orbit Ring 2 (Middle - 340px) */}
        <div
          className="absolute w-[320px] h-[320px] sm:w-[390px] sm:h-[390px] rounded-full border border-indigo-500/18 dark:border-indigo-400/20 animate-orbit-ccw"
          style={{ '--orbit-duration': '38s' } as React.CSSProperties}
        >
          <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-linear-to-br from-fuchsia-400 to-pink-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.55)]" />
        </div>

        {/* Orbit Ring 3 (Inner - 210px) */}
        <div
          className="absolute w-[200px] h-[200px] sm:w-[245px] sm:h-[245px] rounded-full border border-dashed border-violet-500/20 dark:border-violet-400/22 animate-orbit-cw"
          style={{ '--orbit-duration': '24s' } as React.CSSProperties}
        >
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
        </div>
      </div>

      {/* Bottom-Left Counter-Orbit System */}
      <div className="absolute -bottom-40 -left-40 w-[460px] h-[460px] sm:w-[540px] sm:h-[540px] flex items-center justify-center opacity-75 dark:opacity-85">
        <div className="absolute w-44 h-44 rounded-full bg-linear-to-tr from-emerald-400/10 via-cyan-400/10 to-violet-400/10 dark:from-emerald-500/12 dark:via-cyan-500/10 dark:to-violet-500/12 blur-2xl" />

        {/* Outer Ring */}
        <div
          className="absolute w-[400px] h-[400px] sm:w-[470px] sm:h-[470px] rounded-full border border-dashed border-emerald-500/18 dark:border-emerald-400/18 animate-orbit-ccw"
          style={{ '--orbit-duration': '48s' } as React.CSSProperties}
        >
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
          <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-linear-to-br from-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
        </div>

        {/* Inner Ring */}
        <div
          className="absolute w-[255px] h-[255px] sm:w-[300px] sm:h-[300px] rounded-full border border-fuchsia-500/15 dark:border-fuchsia-400/18 animate-orbit-cw"
          style={{ '--orbit-duration': '30s' } as React.CSSProperties}
        >
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-linear-to-br from-amber-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.55)]" />
        </div>
      </div>
    </div>
  );
};
