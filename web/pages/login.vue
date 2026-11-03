<template>
  <main class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="mb-6 text-xl font-semibold text-gray-900">Iniciar sesión</h1>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label for="slug" class="mb-1 block text-sm font-medium text-gray-700">Organización</label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </div>

        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Correo</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const form = reactive({ slug: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');
const auth = useAuthStore();

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const { user } = await useCsrfFetch<{ user: { id: string; name: string; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: form,
    });
    auth.setUser(user);
    await navigateTo('/dashboard');
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    error.value = fetchError.data?.statusMessage ?? 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
}
</script>
