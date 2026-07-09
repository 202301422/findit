import { useState, useCallback } from 'react';
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
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

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

  const fetchListings = useCallback(async (category?: string) => {
    setLoadingListings(true);
    try {
      const data = await profileService.getMyListings(category);
      setListings(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch listings');
    } finally {
      setLoadingListings(false);
    }
  }, []);

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
    loadingStats,
    loadingUpdate,
    fetchProfile,
    fetchListings,
    fetchStats,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  };
}
