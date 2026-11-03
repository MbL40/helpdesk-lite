interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
  }),
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user;
    },
  },
});
