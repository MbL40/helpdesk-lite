<template>
  <main>
    <h1>Hola, {{ auth.user?.name }}</h1>
    <p>Rol: {{ auth.user?.role }}</p>
    <p><NuxtLink to="/tickets">Ver tickets</NuxtLink></p>
    <p>Claims leídos desde la cookie httpOnly (vía servidor, nunca desde JS del navegador):</p>
    <pre>{{ claims }}</pre>
  </main>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const { data: claims } = await useFetch('/api/auth/me');
</script>
