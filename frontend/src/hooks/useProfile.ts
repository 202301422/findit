import { useState, useCallback, useRef } from 'react';
import { profileService } from '../services/profileService';
import type { ProfileData, UpdateProfileData, Listing, ProfileStats } from '../types/profile.types';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { refreshUser } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Pagination state for listings
  const [listingsPage, setListingsPage] = useState(1);
  const [hasMoreListings, setHasMoreListings] = useState(false);
  const [totalListings, setTotalListings] = useState(0);

  const activeReqRef = useRef<string>('');

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch profile');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  /**
   * fetchListings — loads the first page of listings for a given category (or saved posts).
   * Resets pagination state for a fresh load (e.g. when switching tabs).
   */
  const fetchListings = useCallback(async (category?: string) => {
    const reqId = `${category || 'all'}-${Date.now()}`;
    activeReqRef.current = reqId;

    setLoadingListings(true);
    setListingsPage(1);
    setListings([]);
    try {
      if (category === 'saved-posts') {
        const data = await profileService.getSavedPosts(1, 12);
        if (activeReqRef.current === reqId) {
          setListings(data.savedPosts as Listing[]);
          setHasMoreListings(data.hasNextPage);
          setTotalListings(data.total);
        }
      } else {
        const data = await profileService.getMyListings(category, 1, 12);
        if (activeReqRef.current === reqId) {
          setListings(data.listings as Listing[]);
          setHasMoreListings(data.hasNextPage);
          setTotalListings(data.total);
        }
      }
    } catch (err: any) {
      if (activeReqRef.current === reqId) {
        toast.error(err.message || 'Failed to fetch listings');
      }
    } finally {
      if (activeReqRef.current === reqId) {
        setLoadingListings(false);
      }
    }
  }, []);

  /**
   * fetchMoreListings — appends the next page of listings.
   * Called by the infinite scroll sentinel.
   */
  const fetchMoreListings = useCallback(async (category?: string) => {
    setLoadingMoreListings(true);
    const nextPage = listingsPage + 1;
    try {
      if (category === 'saved-posts') {
        const data = await profileService.getSavedPosts(nextPage, 12);
        setListings((prev) => [...prev, ...(data.savedPosts as Listing[])]);
        setHasMoreListings(data.hasNextPage);
        setListingsPage(nextPage);
      } else {
        const data = await profileService.getMyListings(category, nextPage, 12);
        setListings((prev) => [...prev, ...(data.listings as Listing[])]);
        setHasMoreListings(data.hasNextPage);
        setListingsPage(nextPage);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load more listings');
    } finally {
      setLoadingMoreListings(false);
    }
  }, [listingsPage]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await profileService.getProfileStats();
      setStats(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const updateProfile = async (data: UpdateProfileData) => {
    setLoadingUpdate(true);
    try {
      const updated = await profileService.updateProfile(data);
      setProfile(updated);
      await refreshUser();
      toast.success('Profile updated successfully');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
      return false;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const data = await profileService.uploadAvatar(file);
      setProfile((prev) => prev ? { ...prev, avatar: data.avatar } : null);
      await refreshUser();
      toast.success('Avatar uploaded successfully');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
      return false;
    }
  };

  const deleteAvatar = async () => {
    try {
      await profileService.deleteAvatar();
      setProfile((prev) => prev ? { ...prev, avatar: '' } : null);
      await refreshUser();
      toast.success('Avatar removed successfully');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove avatar');
      return false;
    }
  };

  return {
    profile,
    listings,
    stats,
    loadingProfile,
    loadingListings,
    loadingMoreListings,
    loadingStats,
    loadingUpdate,
    hasMoreListings,
    totalListings,
    fetchProfile,
    fetchListings,
    fetchMoreListings,
    fetchStats,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  };
}
