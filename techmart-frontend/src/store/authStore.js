import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const api = (await import('../api/axiosInstance')).default;
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken } = response.data.data;
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          return true;
        } catch (err) {
          set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
          return false;
        }
      },
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      updateAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'techmart-auth',
    }
  )
);
