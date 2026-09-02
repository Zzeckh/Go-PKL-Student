export const TOKEN_KEY = 'gopkl_token';
export const USER_KEY = 'gopkl_user';

export const getToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string, remember: boolean) => {
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const readUser = (): any => {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveUser = (user: any, remember: boolean) => {
  (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(user));
};