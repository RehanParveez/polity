import { apiClient } from './apiClient'

export type User = {
  id: string
  email: string
  full_name: string
  is_active: boolean
  permissions: string[]
  created_at: string       
  role?: string | null      
  updated_at?: string | null
}

export type TokenPair = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type ForgotPasswordResponse = {
  message: string
  dev_reset_token?: string | null
}

export const authService = {
  register: async (email: string, password: string, fullName: string): Promise<User> => {
    const res = await apiClient.post('/auth/register', { email, password, full_name: fullName })
    return res.data
  },
  login: async (email: string, password: string): Promise<TokenPair> => {
    const res = await apiClient.post('/auth/login', { email, password })
    return res.data
  },
  refresh: async (refreshToken: string): Promise<TokenPair> => {
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return res.data
  },
  me: async (token?: string): Promise<User> => {
    const res = await apiClient.get(
      '/auth/me',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
    return res.data
  },
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
  const res = await apiClient.post('/auth/forgot-password', { email })
  return res.data
},
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
  await apiClient.post('/auth/reset-password', { token, new_password: newPassword })
},
}