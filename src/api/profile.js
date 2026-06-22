import api from './axios.js'

export function updateProfile(data) {
  return api.put('/profile', data)
}

export function changePassword(data) {
  return api.put('/profile/password', data)
}
