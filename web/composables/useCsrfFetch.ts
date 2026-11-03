type MutationOptions = {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function useCsrfFetch<T>(request: string, options: MutationOptions): Promise<T> {
  const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf')
  return $fetch<T>(request, {
    ...options,
    headers: { 'x-csrf-token': csrfToken },
  })
}
