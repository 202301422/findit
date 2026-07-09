import type { ProfileStats as StatsType } from '../../types/profile.types';

export default function ProfileStats({ stats }: { stats: StatsType | null }) {
  return (
    <div className="profile-stats-grid">
      <div className="stat-card">
        <span className="stat-value">{stats?.totalListings || 0}</span>
        <span className="stat-label">Total Listings</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats?.activeListings || 0}</span>
        <span className="stat-label">Active Listings</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats?.soldItems || 0}</span>
        <span className="stat-label">Items Sold</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats?.lostItemsReturned || 0}</span>
        <span className="stat-label">Lost Items Found</span>
      </div>
    </div>
  );
}
