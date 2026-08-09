import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../app/store'
import { authService } from './authService'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8004',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']
let isRefreshing = false
let pendingQueue: Array<() => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const skip =
      error.response?.status !== 401 ||
      originalRequest._retry ||
      NO_REFRESH_PATHS.some((p) => originalRequest.url?.includes(p))

    if (skip) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push(() => resolve(apiClient(originalRequest)))
      })
    }

    originalRequest._retry = true
    isRefreshing = true
    const storedRefreshToken = localStorage.getItem('refresh_token')

    if (!storedRefreshToken) {
      useAuthStore.getState().clearAuth()
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      const { access_token, refresh_token } = await authService.refresh(storedRefreshToken)
      localStorage.setItem('refresh_token', refresh_token)
      const user = await authService.me(access_token)
      useAuthStore.getState().setAuth(user, access_token)
      pendingQueue.forEach((resolve) => resolve())
      pendingQueue = []
      return apiClient(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().clearAuth()
      localStorage.removeItem('refresh_token')
      pendingQueue = []
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)