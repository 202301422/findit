import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'cyan';
}

const colorMap = {
  primary: 'from-[var(--color-primary-500)]/10 to-[var(--color-primary-600)]/10 text-[var(--color-primary-500)] border-[var(--color-primary-500)]/20',
  emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/20',
  amber: 'from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/20',
  rose: 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
  indigo: 'from-indigo-500/10 to-purple-500/10 text-indigo-500 border-indigo-500/20',
  purple: 'from-purple-500/10 to-fuchsia-500/10 text-purple-500 border-purple-500/20',
  cyan: 'from-cyan-500/10 to-blue-500/10 text-cyan-500 border-cyan-500/20',
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'primary',
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="p-5 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] relative overflow-hidden transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</h3>
        </div>
        <div
          className={`p-3 rounded-[var(--radius-md)] bg-gradient-to-br ${colorMap[color]} border shadow-inner`}
        >
          {icon}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-secondary)] text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-[var(--color-success-50)] text-[var(--color-success-500)] border border-[var(--color-success-500)]/20'
                  : 'bg-[var(--color-error-50)] text-[var(--color-error-500)] border border-[var(--color-error-500)]/20'
              }`}
            >
              {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-[var(--text-tertiary)] text-xs">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
