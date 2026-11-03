import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import LoginPage from './login.vue';

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));
mockNuxtImport('navigateTo', () => navigateToMock);

describe('login.vue', () => {
  it('envía las credenciales y navega al dashboard si el login es exitoso', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      user: { id: '1', name: 'Agente Prueba', email: 'agente@acme.com', role: 'AGENT' },
    });
    vi.stubGlobal('$fetch', fetchMock);

    const wrapper = await mountSuspended(LoginPage);
    await wrapper.find('#slug').setValue('acme');
    await wrapper.find('#email').setValue('agente@acme.com');
    await wrapper.find('#password').setValue('Test1234!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { slug: 'acme', email: 'agente@acme.com', password: 'Test1234!' },
    });
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra un mensaje de error si el login falla', async () => {
    const fetchMock = vi.fn().mockRejectedValue({ data: { statusMessage: 'Credenciales inválidas' } });
    vi.stubGlobal('$fetch', fetchMock);

    const wrapper = await mountSuspended(LoginPage);
    await wrapper.find('#slug').setValue('acme');
    await wrapper.find('#email').setValue('agente@acme.com');
    await wrapper.find('#password').setValue('bad-password');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Credenciales inválidas');
  });
});