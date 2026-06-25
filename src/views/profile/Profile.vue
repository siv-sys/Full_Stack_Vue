<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import { updateProfile, changePassword } from '../../api/profile.js'
import { useToast } from '../../composables/useToast.js'

const auth = useAuthStore()
const toast = useToast()

const name = ref('')
const email = ref('')
const profileErrors = ref({})
const profileError = ref('')
const savingProfile = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirmation = ref('')
const passwordErrors = ref({})
const passwordError = ref('')
const savingPassword = ref(false)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const emailValid = computed(() => !email.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordsMatch = computed(() => !newPasswordConfirmation.value || newPassword.value === newPasswordConfirmation.value)
const newPwdLong = computed(() => !newPassword.value || newPassword.value.length >= 6)

onMounted(async () => {
  try { await auth.fetchUser() } catch {}
  name.value = auth.user?.name || ''
  email.value = auth.user?.email || ''
})

async function saveProfile() {
  profileErrors.value = {}; profileError.value = ''
  if (!emailValid.value) { profileErrors.value.email = 'Invalid email format'; return }
  savingProfile.value = true
  try {
    await updateProfile({ name: name.value, email: email.value })
    await auth.fetchUser()
    toast.success('Profile updated!')
  } catch (err) {
    if (err.response?.status === 422) {
      const d = err.response.data
      if (d.errors) Object.entries(d.errors).forEach(([k,v]) => { profileErrors.value[k] = Array.isArray(v) ? v[0] : v })
      profileError.value = d.message || 'Validation failed'
    } else {
      profileError.value = err.response?.data?.message || 'Update failed'
      toast.error(profileError.value)
    }
  } finally { savingProfile.value = false }
}

async function savePassword() {
  passwordErrors.value = {}; passwordError.value = ''
  if (!newPwdLong.value) { passwordErrors.value.password = 'Must be at least 6 characters'; return }
  if (!passwordsMatch.value) { passwordErrors.value.password_confirmation = 'Passwords do not match'; return }
  savingPassword.value = true
  try {
    await changePassword({
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: newPasswordConfirmation.value
    })
    toast.success('Password changed!')
    currentPassword.value = ''; newPassword.value = ''; newPasswordConfirmation.value = ''
  } catch (err) {
    if (err.response?.status === 422) {
      const d = err.response.data
      if (d.errors) Object.entries(d.errors).forEach(([k,v]) => { passwordErrors.value[k] = Array.isArray(v) ? v[0] : v })
      passwordError.value = d.message || 'Validation failed'
    } else {
      passwordError.value = err.response?.data?.message || 'Update failed'
      toast.error(passwordError.value)
    }
  } finally { savingPassword.value = false }
}
</script>

<template>
  <div class="profile-page">
    <h1>Profile</h1>

    <section class="section">
      <h2>Update Profile</h2>
      <div v-if="profileError" class="msg error-msg">{{ profileError }}</div>

      <form @submit.prevent="saveProfile">
        <div class="fg">
          <label for="p-name">Name</label>
          <input id="p-name" v-model="name" type="text" :class="{ 'has-error': profileErrors.name }" />
          <span v-if="profileErrors.name" class="field-error">{{ profileErrors.name }}</span>
        </div>
        <div class="fg">
          <label for="p-email">Email</label>
          <input id="p-email" v-model="email" type="email" :class="{ 'has-error': profileErrors.email || (!emailValid && email) }" />
          <span v-if="profileErrors.email" class="field-error">{{ profileErrors.email }}</span>
          <span v-else-if="!emailValid && email" class="field-error">Invalid email format</span>
        </div>
        <button type="submit" class="btn-primary" :disabled="savingProfile || !emailValid">
          {{ savingProfile ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </section>

    <section class="section">
      <h2>Change Password</h2>
      <div v-if="passwordError" class="msg error-msg">{{ passwordError }}</div>

      <form @submit.prevent="savePassword">
        <div class="fg">
          <label for="pw-current">Current Password</label>
          <div class="pw-wrap">
            <input id="pw-current" v-model="currentPassword" :type="showCurrent ? 'text' : 'password'" :class="{ 'has-error': passwordErrors.current_password }" />
            <button type="button" class="pw-toggle" @click="showCurrent = !showCurrent" :aria-label="showCurrent ? 'Hide password' : 'Show password'" tabindex="-1">
              {{ showCurrent ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="passwordErrors.current_password" class="field-error">{{ passwordErrors.current_password }}</span>
        </div>
        <div class="fg">
          <label for="pw-new">New Password</label>
          <div class="pw-wrap">
            <input id="pw-new" v-model="newPassword" :type="showNew ? 'text' : 'password'" :class="{ 'has-error': passwordErrors.password || (!newPwdLong && newPassword) }" />
            <button type="button" class="pw-toggle" @click="showNew = !showNew" :aria-label="showNew ? 'Hide password' : 'Show password'" tabindex="-1">
              {{ showNew ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="passwordErrors.password" class="field-error">{{ passwordErrors.password }}</span>
          <span v-else-if="!newPwdLong && newPassword" class="field-error">Must be at least 6 characters</span>
        </div>
        <div class="fg">
          <label for="pw-confirm">Confirm New Password</label>
          <div class="pw-wrap">
            <input id="pw-confirm" v-model="newPasswordConfirmation" :type="showConfirm ? 'text' : 'password'" :class="{ 'has-error': passwordErrors.password_confirmation || (!passwordsMatch && newPasswordConfirmation) }" />
            <button type="button" class="pw-toggle" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide password' : 'Show password'" tabindex="-1">
              {{ showConfirm ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="passwordErrors.password_confirmation" class="field-error">{{ passwordErrors.password_confirmation }}</span>
          <span v-else-if="!passwordsMatch && newPasswordConfirmation" class="field-error">Passwords do not match</span>
        </div>
        <button type="submit" class="btn-primary" :disabled="savingPassword || (!passwordsMatch && !!newPasswordConfirmation) || (!newPwdLong && !!newPassword)">
          {{ savingPassword ? 'Updating...' : 'Change Password' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.profile-page h1 { font-size: 26px; margin: 0 0 28px; }

.section {
  max-width: 480px; margin-bottom: 36px; padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
}
.section:last-child { border-bottom: none; }
.section h2 { font-size: 19px; margin: 0 0 14px; }

.fg { margin-bottom: 14px; }
.fg label { display: block; font-size: 13px; font-weight: 500; color: var(--text-h); margin-bottom: 5px; }

.fg input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 15px; background: var(--bg); color: var(--text-h);
  transition: border-color var(--transition);
}
.fg input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
.has-error { border-color: var(--danger) !important; }

.pw-wrap { position: relative; }
.pw-wrap input { padding-right: 56px; }
.pw-toggle {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--accent); font-size: 13px;
  cursor: pointer; padding: 6px 8px; font-weight: 500;
}

.field-error { display: block; font-size: 12px; color: var(--danger); margin-top: 4px; }

.msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 12px; }
.error-msg { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }

.btn-primary {
  padding: 10px 24px; background: var(--accent); color: #fff; border: none;
  border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer;
  margin-top: 4px; transition: background var(--transition);
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
