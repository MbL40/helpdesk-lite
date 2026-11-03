<template>
  <div class="mx-auto max-w-lg">
    <h1 class="mb-6 text-2xl font-semibold text-gray-900">Nuevo ticket</h1>
    <form class="space-y-4 rounded-lg border border-gray-200 bg-white p-6" @submit.prevent="onSubmit">
      <div>
        <label for="title" class="mb-1 block text-sm font-medium text-gray-700">Título</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          maxlength="200"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
      </div>

      <div>
        <label for="description" class="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          required
          rows="4"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="priority" class="mb-1 block text-sm font-medium text-gray-700">Prioridad</label>
        <select
          id="priority"
          v-model="form.priority"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="" disabled>Selecciona...</option>
          <option value="CRITICAL">Crítica</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ loading ? 'Creando...' : 'Crear ticket' }}
      </button>

      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
if (auth.user?.role !== 'CUSTOMER') {
  await navigateTo('/tickets');
}

const form = reactive({ title: '', description: '', priority: '' });
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await useCsrfFetch('/api/tickets', { method: 'POST', body: form });
    await navigateTo('/tickets');
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    error.value = fetchError.data?.statusMessage ?? 'No se pudo crear el ticket';
  } finally {
    loading.value = false;
  }
}
</script>
