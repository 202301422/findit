import ProductCard from '@/components/product/ProductCard'
import type { Listing } from '../../types/profile.types'

export default function ListingCard({ listing }: { listing: Listing }) {
  // Adapt profile Listing structure to ProductCard input format
  const item = {
    ...listing,
    _id: listing._id,
    name: listing.title || (listing as any).name || (listing as any).ticketType || 'Untitled',
    images: listing.images && listing.images.length > 0
      ? listing.images
      : (listing as any).image ? [{ url: (listing as any).image, publicId: 'primary' }] : [],
    price: listing.price ?? (listing as any).sellingPrice,
    sellingPrice: listing.price ?? (listing as any).sellingPrice,
    status: listing.status || 'active',
    createdAt: listing.createdAt,
    type: listing.type,
  }

  return (
    <ProductCard
      item={item}
      type={listing.type}
      tabLabel={listing.category || (listing as any).tabLabel || 'Buy & Sell'}
    />
  )
}

