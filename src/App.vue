<script setup>
import ToastContainer from './components/common/ToastContainer.vue'
import ConfirmModal from './components/common/ConfirmModal.vue'
</script>

<template>
  <router-view />
  <ToastContainer />
  <ConfirmModal />
</template>
