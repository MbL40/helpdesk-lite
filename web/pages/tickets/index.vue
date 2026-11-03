<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Tickets</h1>
      <NuxtLink
        v-if="auth.user?.role === 'CUSTOMER'"
        to="/tickets/new"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Nuevo ticket
      </NuxtLink>
    </div>

    <p v-if="error" role="alert" class="text-sm text-red-600">No se pudieron cargar los tickets.</p>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Título</th>
            <th class="px-4 py-3 font-medium">Prioridad</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Vence SLA</th>
            <th class="px-4 py-3 font-medium">Agente</th>
            <th v-if="auth.user?.role === 'AGENT'" class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="ticket in tickets" :key="ticket.id">
            <td class="px-4 py-3 text-gray-900">{{ ticket.title }}</td>
            <td class="px-4 py-3">
              <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_STYLES[ticket.priority]]">
                {{ ticket.priority }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[ticket.status]]">
                {{ ticket.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(ticket.slaDueAt) }}</td>
            <td class="px-4 py-3 text-gray-500">{{ ticket.agentId ?? 'Sin asignar' }}</td>
            <td v-if="auth.user?.role === 'AGENT'" class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  v-if="!ticket.agentId"
                  :disabled="assigning === ticket.id"
                  class="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  @click="assign(ticket.id)"
                >
                  Asignarme
                </button>
                <select
                  v-if="nextStatuses(ticket.status).length"
                  aria-label="Cambiar estado"
                  class="rounded-md border border-gray-300 px-2 py-1 text-xs"
                  @change="onStatusChange($event, ticket.id)"
                >
                  <option value="" selected disabled>Cambiar estado...</option>
                  <option v-for="status in nextStatuses(ticket.status)" :key="status" :value="status">
                    {{ status }}
                  </option>
                </select>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="actionError" role="alert" class="text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup lang="ts">
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDueAt: string;
  agentId: string | null;
}

const auth = useAuthStore();
const { data: tickets, error, refresh } = await useFetch<Ticket[]>('/api/tickets');
const assigning = ref<string | null>(null);
const actionError = ref('');

const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-700',
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

function nextStatuses(status: TicketStatus) {
  return NEXT_STATUSES[status];
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

async function assign(ticketId: string) {
  assigning.value = ticketId;
  actionError.value = '';
  try {
    await $fetch(`/api/tickets/${ticketId}/assign`, { method: 'PATCH' });
    await refresh();
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    actionError.value = fetchError.data?.statusMessage ?? 'No se pudo asignar el ticket';
  } finally {
    assigning.value = null;
  }
}

async function changeStatus(ticketId: string, status: string) {
  actionError.value = '';
  try {
    await $fetch(`/api/tickets/${ticketId}/status`, { method: 'PATCH', body: { status } });
    await refresh();
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    actionError.value = fetchError.data?.statusMessage ?? 'No se pudo cambiar el estado';
  }
}

function onStatusChange(event: Event, ticketId: string) {
  const value = (event.target as HTMLSelectElement).value;
  if (value) changeStatus(ticketId, value);
}
</script>
