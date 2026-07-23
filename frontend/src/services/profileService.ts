import api from '../utils/api';
import type { ProfileData, UpdateProfileData, Listing, ProfileStats } from '../types/profile.types';

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

  changePassword: async (data: any): Promise<void> => {
    await api.patch('/profile/change-password', data);
  },

  deleteAccount: async (password?: string): Promise<void> => {
    await api.delete('/profile', { data: { password } });
  },

  getMyListings: async (
    category?: string,
    page = 1,
    limit = 12
  ): Promise<{ listings: any[]; hasNextPage: boolean; total: number }> => {
    const res = await api.get('/profile/listings', { params: { category, page, limit } });
    return {
      listings: res.data.data.all,
      hasNextPage: res.data.data.hasNextPage,
      total: res.data.data.total,
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
  ): Promise<{ savedPosts: any[]; hasNextPage: boolean; total: number }> => {
    const res = await api.get('/profile/saved', { params: { page, limit } });
    return {
      savedPosts: res.data.data.savedPosts,
      hasNextPage: res.data.data.hasNextPage,
      total: res.data.data.total,
    };
  },

  searchUsers: async (query: string): Promise<any[]> => {
    if (!query.trim()) return [];
    const res = await api.get('/profile/search-users', { params: { q: query } });
    return res.data.data.users || [];
  },

  getPublicProfile: async (userId: string): Promise<{ user: any; listings: any[]; stats: any }> => {
    const res = await api.get(`/profile/user/${userId}`);
    return res.data.data;
  },
};
