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

    <div class="flex flex-wrap items-center gap-3">
      <div>
        <label for="filter-status" class="sr-only">Filtrar por estado</label>
        <select
          id="filter-status"
          v-model="statusFilter"
          class="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">Todos los estados</option>
          <option v-for="status in STATUSES" :key="status" :value="status">{{ status }}</option>
        </select>
      </div>
      <div>
        <label for="filter-priority" class="sr-only">Filtrar por prioridad</label>
        <select
          id="filter-priority"
          v-model="priorityFilter"
          class="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">Todas las prioridades</option>
          <option v-for="priority in PRIORITIES" :key="priority" :value="priority">{{ priority }}</option>
        </select>
      </div>
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
            <td class="px-4 py-3 text-gray-900">
              <NuxtLink :to="`/tickets/${ticket.id}`" class="hover:underline">{{ ticket.title }}</NuxtLink>
            </td>
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
            <td class="px-4 py-3 text-gray-500">
              <div class="flex items-center gap-2">
                <span>{{ formatDate(ticket.slaDueAt) }}</span>
                <span
                  v-if="slaIndicatorInfo(ticket)"
                  :class="['rounded-full px-2 py-0.5 text-xs font-medium', slaIndicatorInfo(ticket)!.style]"
                >
                  {{ slaIndicatorInfo(ticket)!.label }}
                </span>
              </div>
            </td>
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
                  :key="ticket.status"
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
          <tr v-if="tickets.length === 0">
            <td :colspan="auth.user?.role === 'AGENT' ? 6 : 5" class="px-4 py-6 text-center text-gray-400">
              Sin tickets que coincidan con los filtros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-600">
      <button
        :disabled="page <= 1"
        class="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
        @click="page--"
      >
        Anterior
      </button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button
        :disabled="page >= totalPages"
        class="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
        @click="page++"
      >
        Siguiente
      </button>
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

interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PAGE_SIZE = 10;

const auth = useAuthStore();
const statusFilter = ref('');
const priorityFilter = ref('');
const page = ref(1);

const query = computed(() => ({
  status: statusFilter.value || undefined,
  priority: priorityFilter.value || undefined,
  page: page.value,
  pageSize: PAGE_SIZE,
}));

const { data: response, error, refresh } = await useFetch<TicketsResponse>('/api/tickets', { query });

const tickets = computed(() => response.value?.data ?? []);
const totalPages = computed(() => Math.max(1, Math.ceil((response.value?.total ?? 0) / PAGE_SIZE)));

watch([statusFilter, priorityFilter], () => {
  page.value = 1;
});

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
  return new Date(value).toLocaleString('es-CO');
}

function slaIndicatorInfo(ticket: { slaDueAt: string; status: TicketStatus }) {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return null;
  const due = new Date(ticket.slaDueAt).getTime();
  const now = Date.now();
  if (due < now) return { label: 'Vencido', style: 'bg-red-100 text-red-700' };
  if (due - now <= 60 * 60 * 1000) return { label: 'Vence pronto', style: 'bg-amber-100 text-amber-700' };
  return null;
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