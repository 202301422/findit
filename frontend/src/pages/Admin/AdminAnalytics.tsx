import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

const COLORS = ['#FF7A30', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444'];

export default function AdminAnalytics() {
  const [days, setDays] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/analytics?days=${days}`);
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics();
  }, [days]);

  const userGrowth = analyticsData?.userGrowth || [];
  const listingsGrowth = analyticsData?.listingsGrowth || [];
  const categoryDistribution = analyticsData?.categoryDistribution || [];
  const lostVsFound = analyticsData?.lostVsFoundRatio || { marketplace: 0, found: 0 };

  const barData = [
    { name: 'Marketplace Items', count: lostVsFound.marketplace },
    { name: 'Lost & Found Items', count: lostVsFound.found },
  ];

  return (
    <div className="space-y-8">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-md)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-primary-500)]" /> Analytics & Platform Trends
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Analyze growth trajectories, listing distributions, and engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-transparent font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <button
            onClick={() => void fetchAnalytics()}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Growth */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[var(--color-primary-500)]" /> User Registration Trend
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">New Signups</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A30" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF7A30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-card)',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#FF7A30"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Listing Growth */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Marketplace Product Volume
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Listings Created</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={listingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-card)',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="listings"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#22C55E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Category Distribution & Entity Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Product Category Share
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Marketplace Breakdown</span>
          </div>

          <div className="h-64">
            {categoryDistribution.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-20">No category data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                  >
                    {categoryDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-card)',
                      borderColor: 'var(--border-primary)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Marketplace vs Lost & Found Comparison */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Marketplace vs. Lost & Found Ratio
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Platform Activity</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-card)',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#FF7A30" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
