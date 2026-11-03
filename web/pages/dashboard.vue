<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Hola, {{ auth.user?.name }}</h1>
      <p class="mt-1 text-sm text-gray-500">Rol: {{ auth.user?.role }}</p>
    </div>

    <NuxtLink to="/tickets" class="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
      Ver tickets →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
</script>
