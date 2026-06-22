<script setup>
import ToastContainer from './components/ToastContainer.vue'
import ConfirmModal from './components/ConfirmModal.vue'
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
  <ToastContainer />
  <ConfirmModal />
</template>
