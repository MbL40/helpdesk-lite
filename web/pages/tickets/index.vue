<template>
  <main>
    <h1>Tickets</h1>
    <p>
      <NuxtLink v-if="auth.user?.role === 'CUSTOMER'" to="/tickets/new">Nuevo ticket</NuxtLink>
    </p>

    <p v-if="error" role="alert">No se pudieron cargar los tickets.</p>

    <table v-else>
      <thead>
        <tr>
          <th>Título</th>
          <th>Prioridad</th>
          <th>Estado</th>
          <th>Vence SLA</th>
          <th>Agente</th>
          <th v-if="auth.user?.role === 'AGENT'">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id">
          <td>{{ ticket.title }}</td>
          <td>{{ ticket.priority }}</td>
          <td>{{ ticket.status }}</td>
          <td>{{ formatDate(ticket.slaDueAt) }}</td>
          <td>{{ ticket.agentId ?? 'Sin asignar' }}</td>
          <td v-if="auth.user?.role === 'AGENT'">
            <button v-if="!ticket.agentId" :disabled="assigning === ticket.id" @click="assign(ticket.id)">
              Asignarme
            </button>
            <select
              v-if="nextStatuses(ticket.status).length"
              aria-label="Cambiar estado"
              @change="onStatusChange($event, ticket.id)"
            >
              <option value="" selected disabled>Cambiar estado...</option>
              <option v-for="status in nextStatuses(ticket.status)" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="actionError" role="alert">{{ actionError }}</p>
  </main>
</template>

<script setup lang="ts">
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
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