export interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  avatar?: string;
  bio?: string;
  college?: string;
  city?: string;
  state?: string;
  country?: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  isVerified: boolean;
  authProvider: 'local' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  username?: string;
  phone?: string;
  bio?: string;
  college?: string;
  city?: string;
  state?: string;
  country?: string;
}

export type ListingStatus = 'active' | 'sold' | 'closed' | 'expired' | 'draft';
export type ListingCategory = 'Lost & Found' | 'Event Passes' | 'Travelling Tickets' | 'Buy & Sell';

export interface Listing {
  _id: string;
  title: string;
  image: string;
  price?: number;
  status: ListingStatus;
  createdAt: string;
  category: ListingCategory;
  type: 'found' | 'pass' | 'ticket' | 'sell';
}

export interface ProfileStats {
  totalListings: number;
  activeListings: number;
  soldItems: number;
  lostItemsReturned: number;
  ticketsSold: number;
}
