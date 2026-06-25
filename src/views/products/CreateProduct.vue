<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, createProduct } from '../../api/products.js'
import { useToast } from '../../composables/useToast.js'

const router = useRouter()
const toast = useToast()

const categories = ref([])
const name = ref('')
const categoryId = ref('')
const description = ref('')
const price = ref('')
const stock = ref(0)
const imageFile = ref(null)
const imageUrl = ref('')
const imagePreview = ref(null)
const errors = ref({})
const error = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    const { data } = await getCategories()
    categories.value = data || []
  } catch {
    toast.error('Failed to load categories')
  }
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
    imageUrl.value = ''
  }
}

function clearFile() {
  imageFile.value = null
  imagePreview.value = null
}

async function handleSubmit() {
  errors.value = {}
  error.value = ''
  submitting.value = true

  const formData = new FormData()
  formData.append('name', name.value)
  formData.append('category_id', categoryId.value)
  formData.append('description', description.value)
  formData.append('price', price.value)
  formData.append('stock', stock.value)

  if (imageFile.value) {
    formData.append('image', imageFile.value)
  } else if (imageUrl.value.trim()) {
    formData.append('image_url', imageUrl.value.trim())
  }

  try {
    await createProduct(formData)
    toast.success('Product created!')
    router.push('/products')
  } catch (err) {
    console.error('Create product failed:', err.response)
    if (err.response?.status === 422 && err.response.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([k, v]) => {
        errors.value[k] = Array.isArray(v) ? v[0] : v
      })
    }
    if (err.response?.status === 403) {
      error.value = 'Access denied. Admin privileges required.'
    } else {
      error.value = err.response?.data?.message || 'Failed to create product'
    }
    toast.error(error.value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="create-page">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <router-link to="/products">Products</router-link>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      <span>Create Product</span>
    </nav>

    <h1>Create Product</h1>

    <div v-if="error" class="msg error-msg">{{ error }}</div>

    <form class="product-form" @submit.prevent="handleSubmit">
      <div class="fg">
        <label for="name">Name <span class="req">*</span></label>
        <input id="name" v-model="name" type="text" placeholder="Product name" required :class="{ 'has-error': errors.name }" />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <div class="fg">
        <label for="category_id">Category <span class="req">*</span></label>
        <select id="category_id" v-model="categoryId" required :class="{ 'has-error': errors.category_id }">
          <option value="">Select category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <span v-if="errors.category_id" class="field-error">{{ errors.category_id }}</span>
      </div>

      <div class="form-row">
        <div class="fg">
          <label for="price">Price <span class="req">*</span></label>
          <input id="price" v-model="price" type="number" step="0.01" min="0" placeholder="0.00" required :class="{ 'has-error': errors.price }" />
          <span v-if="errors.price" class="field-error">{{ errors.price }}</span>
        </div>
        <div class="fg">
          <label for="stock">Stock <span class="req">*</span></label>
          <input id="stock" v-model.number="stock" type="number" min="0" required :class="{ 'has-error': errors.stock }" />
          <span v-if="errors.stock" class="field-error">{{ errors.stock }}</span>
        </div>
      </div>

      <div class="fg">
        <label for="description">Description</label>
        <textarea id="description" v-model="description" rows="4" placeholder="Product description..." :class="{ 'has-error': errors.description }"></textarea>
        <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
      </div>

      <div class="fg">
        <label>Product Image</label>
        <div class="image-input">
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Preview" />
            <button type="button" class="clear-btn" @click="clearFile" aria-label="Remove image">&times;</button>
          </div>
          <div class="image-options">
            <div>
              <label for="image-file" class="file-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload File
              </label>
              <input id="image-file" type="file" accept="image/*" @change="onFileChange" />
            </div>
            <div class="or-divider">or</div>
            <div style="flex:1">
              <input v-model="imageUrl" type="url" placeholder="Paste image URL..." :disabled="!!imageFile" :class="{ 'has-error': errors.image_url }" />
            </div>
          </div>
        </div>
        <span v-if="errors.image" class="field-error">{{ errors.image }}</span>
        <span v-if="errors.image_url" class="field-error">{{ errors.image_url }}</span>
      </div>

      <div class="form-actions">
        <router-link to="/products" class="btn-cancel">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Creating...' : 'Create Product' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-page { max-width: 640px; }

.breadcrumbs {
  display: flex; align-items: center; gap: 6px; margin-bottom: 18px;
  font-size: 13px; color: var(--text);
}
.breadcrumbs a { color: var(--accent); text-decoration: none; }
.breadcrumbs a:hover { text-decoration: underline; }
.breadcrumbs svg { color: var(--border); flex-shrink: 0; }

h1 { font-size: 26px; margin: 0 0 24px; }

.msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.error-msg { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }

.product-form { display: flex; flex-direction: column; gap: 0; }

.fg { margin-bottom: 16px; }
.fg label { display: block; font-size: 13px; font-weight: 500; color: var(--text-h); margin-bottom: 5px; }
.req { color: var(--danger); }

.fg input,
.fg select,
.fg textarea {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 15px; background: var(--bg); color: var(--text-h); font-family: inherit;
  transition: border-color var(--transition);
}
.fg textarea { resize: vertical; min-height: 90px; }
.fg input:focus, .fg select:focus, .fg textarea:focus {
  outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg);
}
.has-error { border-color: var(--danger) !important; }

.field-error { display: block; font-size: 12px; color: var(--danger); margin-top: 4px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* Image input */
.image-input { border: 1px dashed var(--border); border-radius: 8px; padding: 16px; }

.image-preview {
  position: relative; display: inline-block; margin-bottom: 12px;
}
.image-preview img {
  width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);
}
.clear-btn {
  position: absolute; top: -6px; right: -6px; width: 22px; height: 22px;
  border-radius: 50%; border: 1px solid var(--border); background: var(--bg);
  color: var(--danger); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.clear-btn:hover { background: var(--danger-bg); }

.image-options { display: flex; align-items: center; gap: 12px; }

.file-label {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 13px; font-weight: 500; color: var(--text-h); cursor: pointer;
  transition: all var(--transition);
}
.file-label:hover { border-color: var(--accent); color: var(--accent); }

#image-file { display: none; }

.or-divider { font-size: 12px; color: var(--text); }

.image-options input[type="url"] {
  padding: 8px 12px; font-size: 14px;
}
.image-options input[type="url"]:disabled {
  opacity: 0.5; cursor: not-allowed;
}

/* Actions */
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }

.btn-cancel {
  padding: 10px 24px; border: 1px solid var(--border); background: transparent;
  color: var(--text-h); border-radius: 8px; font-size: 14px; text-decoration: none;
  transition: all var(--transition); cursor: pointer;
}
.btn-cancel:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

.btn-primary {
  padding: 10px 24px; background: var(--accent); color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: background var(--transition);
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .image-options { flex-direction: column; align-items: stretch; }
  .or-divider { text-align: center; }
}
</style>
