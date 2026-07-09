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

  getMyListings: async (category?: string): Promise<Listing[]> => {
    const res = await api.get('/profile/listings', { params: { category } });
    return res.data.data.all;
  },

  getProfileStats: async (): Promise<ProfileStats> => {
    const res = await api.get('/profile/stats');
    return res.data.data.stats;
  },
};
