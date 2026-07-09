import type { Listing } from '../../types/profile.types';

export default function ListingCard({ listing }: { listing: Listing }) {
  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="listing-card">
      <img src={listing.image} alt={listing.title} className="listing-card-img" />
      <div className="listing-card-body">
        <h4 className="listing-card-title" title={listing.title}>{listing.title}</h4>
        
        {listing.price !== undefined && (
          <div className="listing-card-price">
            ${listing.price}
          </div>
        )}
        
        <div className="listing-card-meta">
          <span className={`status-badge ${listing.status}`}>{listing.status}</span>
          <span className="listing-card-date">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
