<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
      >
        <NuxtLink to="/dashboard" class="text-lg font-semibold text-gray-900">
          HelpDesk Lite
        </NuxtLink>
        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink to="/dashboard" class="text-gray-600 hover:text-gray-900"
            >Dashboard</NuxtLink
          >
          <NuxtLink to="/tickets" class="text-gray-600 hover:text-gray-900"
            >Tickets</NuxtLink
          >
          <NuxtLink
            v-if="auth.user?.role === 'ADMIN'"
            to="/reports/sla"
            class="text-gray-600 hover:text-gray-900"
          >
            Reporte SLA
          </NuxtLink>
          <span v-if="auth.user" class="flex items-center gap-3 text-gray-400">
            {{ auth.user.name ?? auth.user.role }}
            <button class="text-gray-600 hover:text-gray-900" @click="logout">
              Salir
            </button>
          </span>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  auth.setUser(null);
  await navigateTo('/login');
}
</script>
