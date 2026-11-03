<template>
  <main>
    <h1>Nuevo ticket</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="title">Título</label>
        <input id="title" v-model="form.title" type="text" required maxlength="200">
      </div>

      <div>
        <label for="description">Descripción</label>
        <textarea id="description" v-model="form.description" required />
      </div>

      <div>
        <label for="priority">Prioridad</label>
        <select id="priority" v-model="form.priority" required>
          <option value="" disabled>Selecciona...</option>
          <option value="CRITICAL">Crítica</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Creando...' : 'Crear ticket' }}
      </button>

      <p v-if="error" role="alert">{{ error }}</p>
    </form>
  </main>
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
    await $fetch('/api/tickets', { method: 'POST', body: form });
    await navigateTo('/tickets');
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    error.value = fetchError.data?.statusMessage ?? 'No se pudo crear el ticket';
  } finally {
    loading.value = false;
  }
}
</script>