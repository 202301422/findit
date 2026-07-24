import api from '../utils/api';
import type { ProfileData, UpdateProfileData, ProfileStats, Listing } from '../types/profile.types';

export interface PasswordChangeData {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  email?: string;
  college?: string;
  isVerified?: boolean;
  followers?: any[];
  following?: any[];
}

export interface SavedPostItem {
  _id: string;
  itemId: string;
  itemType: string;
  title?: string;
  price?: number;
  image?: string;
  createdAt: string;
}

export const profileService = {
  getProfile: async (): Promise<ProfileData> => {
    const res = await api.get('/profile');
    return res.data.data.user;
  },

  updateProfile: async (data: UpdateProfileData): Promise<ProfileData> => {
    const res = await api.put('/profile', data);
    return res.data.data.user;
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete('/profile/avatar');
  },

  changePassword: async (data: PasswordChangeData): Promise<void> => {
    await api.patch('/profile/change-password', data);
  },

  deleteAccount: async (password?: string): Promise<void> => {
    await api.delete('/profile', { data: { password } });
  },

  getMyListings: async (
    category?: string,
    page = 1,
    limit = 12
  ): Promise<{ listings: Listing[]; hasNextPage: boolean; total: number }> => {
    const res = await api.get('/profile/listings', { params: { category, page, limit } });
    return {
      listings: res.data.data.all || [],
      hasNextPage: Boolean(res.data.data.hasNextPage),
      total: res.data.data.total || 0,
    };
  },

  getProfileStats: async (): Promise<ProfileStats> => {
    const res = await api.get('/profile/stats');
    return res.data.data.stats;
  },

  toggleSavedPost: async (itemId: string, itemType: string): Promise<{ saved: boolean }> => {
    const res = await api.post('/profile/saved', { itemId, itemType });
    return res.data.data;
  },

  getSavedPosts: async (
    page = 1,
    limit = 20
  ): Promise<{ savedPosts: SavedPostItem[]; hasNextPage: boolean; total: number }> => {
    const res = await api.get('/profile/saved', { params: { page, limit } });
    return {
      savedPosts: res.data.data.savedPosts || [],
      hasNextPage: Boolean(res.data.data.hasNextPage),
      total: res.data.data.total || 0,
    };
  },

  searchUsers: async (query: string): Promise<UserSummary[]> => {
    if (!query.trim()) return [];
    const res = await api.get('/profile/search-users', { params: { q: query } });
    return res.data.data.users || [];
  },

  getPublicProfile: async (userId: string): Promise<{ user: UserSummary; listings: Listing[]; stats: ProfileStats }> => {
    const res = await api.get(`/profile/user/${userId}`);
    return res.data.data;
  },

  toggleFollowUser: async (
    targetUserId: string,
    notifyOnPost = true
  ): Promise<{ isFollowing: boolean; notifyOnPost: boolean; followersCount: number; followingCount: number }> => {
    const res = await api.post(`/profile/follow/${targetUserId}`, { notifyOnPost });
    return res.data.data;
  },

  toggleFollowNotifications: async (
    targetUserId: string,
    notifyOnPost: boolean
  ): Promise<{ notifyOnPost: boolean }> => {
    const res = await api.patch(`/profile/follow-notifications/${targetUserId}`, { notifyOnPost });
    return res.data.data;
  },

  getUserFollowers: async (userId: string): Promise<UserSummary[]> => {
    const res = await api.get(`/profile/followers/${userId}`);
    return res.data.data.followers || [];
  },

  removeFollower: async (followerUserId: string): Promise<{ followersCount: number }> => {
    const res = await api.delete(`/profile/followers/${followerUserId}`);
    return res.data.data;
  },

  getUserFollowing: async (userId: string): Promise<UserSummary[]> => {
    const res = await api.get(`/profile/following/${userId}`);
    return res.data.data.following || [];
  },

  getFollowingFeed: async (
    page = 1,
    limit = 12
  ): Promise<{ listings: Listing[]; hasNextPage: boolean; total: number }> => {
    const res = await api.get('/profile/feed/following', { params: { page, limit } });
    return {
      listings: res.data.data.listings || [],
      hasNextPage: Boolean(res.data.data.hasNextPage),
      total: res.data.data.total || 0,
    };
  },
};
