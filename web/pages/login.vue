<template>
  <main>
    <h1>Iniciar sesión</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="slug">Organización</label>
        <input id="slug" v-model="form.slug" type="text" required>
      </div>

      <div>
        <label for="email">Correo</label>
        <input id="email" v-model="form.email" type="email" required>
      </div>

      <div>
        <label for="password">Contraseña</label>
        <input id="password" v-model="form.password" type="password" required>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <p v-if="error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
const form = reactive({ slug: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');
const auth = useAuthStore();

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const { user } = await $fetch('/api/auth/login', {
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
