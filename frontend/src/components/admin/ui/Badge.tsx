import type { ReactNode } from 'react';

type BadgeVariant =
  | 'active'
  | 'suspended'
  | 'banned'
  | 'pending'
  | 'resolved'
  | 'dismissed'
  | 'admin'
  | 'user'
  | 'sold'
  | 'expired'
  | 'draft'
  | 'featured'
  | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  banned: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold',
  user: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  sold: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  expired: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  featured: 'bg-amber-500/15 text-amber-300 border-amber-400/40 font-semibold shadow-sm',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

export default function Badge({ variant, children, icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variantStyles[variant] || variantStyles.info
      }`}
    >
      {icon}
      {children}
    </span>
  );
}
