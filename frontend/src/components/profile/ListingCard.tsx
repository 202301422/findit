import ProductCard from '@/components/product/ProductCard'
import type { Listing } from '../../types/profile.types'

export default function ListingCard({ listing }: { listing: Listing }) {
  // Adapt profile Listing structure to ProductCard input format
  const item = {
    _id: listing._id,
    name: listing.title,
    images: listing.images || (listing.image ? [{ url: listing.image, publicId: 'primary' }] : []),
    price: listing.price,
    sellingPrice: listing.price,
    status: listing.status,
    createdAt: listing.createdAt,
    type: listing.type,
  }

  return (
    <ProductCard
      item={item}
      type={listing.type}
      tabLabel={listing.category}
    />
  )
}
