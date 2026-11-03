<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <NuxtLink to="/tickets" class="text-sm text-indigo-600 hover:text-indigo-700">← Volver a tickets</NuxtLink>

    <p v-if="error" role="alert" class="text-sm text-red-600">No se pudo cargar el ticket.</p>

    <template v-else-if="ticket">
      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-xl font-semibold text-gray-900">{{ ticket.title }}</h1>
          <div class="flex gap-2">
            <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_STYLES[ticket.priority]]">
              {{ ticket.priority }}
            </span>
            <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[ticket.status]]">
              {{ ticket.status }}
            </span>
          </div>
        </div>

        <p class="mt-4 whitespace-pre-wrap text-sm text-gray-700">{{ ticket.description }}</p>

        <dl class="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt class="text-gray-500">Cliente</dt>
            <dd class="text-gray-900">{{ ticket.customer.name }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Agente</dt>
            <dd class="text-gray-900">{{ ticket.agent?.name ?? 'Sin asignar' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Vence SLA</dt>
            <dd class="flex items-center gap-2 text-gray-900">
              <span>{{ formatDate(ticket.slaDueAt) }}</span>
              <span
                v-if="slaIndicator"
                :class="['rounded-full px-2 py-0.5 text-xs font-medium', slaIndicator.style]"
              >
                {{ slaIndicator.label }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Creado</dt>
            <dd class="text-gray-900">{{ formatDate(ticket.createdAt) }}</dd>
          </div>
        </dl>

        <div v-if="auth.user?.role === 'AGENT'" class="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            v-if="!ticket.agentId"
            :disabled="assigning"
            class="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="assign"
          >
            Asignarme
          </button>
          <select
            v-if="nextStatuses(ticket.status).length"
            :key="ticket.status"
            aria-label="Cambiar estado"
            class="rounded-md border border-gray-300 px-2 py-1 text-xs"
            @change="onStatusChange"
          >
            <option value="" selected disabled>Cambiar estado...</option>
            <option v-for="status in nextStatuses(ticket.status)" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <p v-if="actionError" role="alert" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Comentarios</h2>

        <ul class="space-y-3">
          <li v-for="comment in comments" :key="comment.id" class="rounded-md bg-gray-50 p-3 text-sm">
            <div class="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span class="font-medium text-gray-700">{{ comment.user.name }}</span>
              <span>{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p class="whitespace-pre-wrap text-gray-700">{{ comment.body }}</p>
          </li>
          <li v-if="comments && comments.length === 0" class="text-sm text-gray-400">Sin comentarios todavía.</li>
        </ul>

        <form class="mt-4 space-y-2" @submit.prevent="submitComment">
          <label for="comment-body" class="sr-only">Nuevo comentario</label>
          <textarea
            id="comment-body"
            v-model="newComment"
            rows="3"
            placeholder="Escribe un comentario..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            :disabled="postingComment || !newComment.trim()"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ postingComment ? 'Enviando...' : 'Comentar' }}
          </button>
        </form>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Historial de auditoría</h2>

        <ul class="space-y-2 text-sm">
          <li v-for="entry in auditLog" :key="entry.id" class="flex items-center justify-between">
            <span class="text-gray-700">
              <span class="font-medium">{{ entry.user.name }}</span>
              {{
                entry.action === 'STATUS_CHANGED'
                  ? `cambió el estado de ${entry.oldValue} a ${entry.newValue}`
                  : 'se asignó el ticket'
              }}
            </span>
            <span class="text-xs text-gray-400">{{ formatDate(entry.createdAt) }}</span>
          </li>
          <li v-if="auditLog && auditLog.length === 0" class="text-sm text-gray-400">Sin cambios registrados.</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDueAt: string;
  createdAt: string;
  agentId: string | null;
  customer: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { name: string; role: string };
}

interface AuditEntry {
  id: string;
  action: 'STATUS_CHANGED' | 'AGENT_ASSIGNED';
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

const route = useRoute();
const ticketId = route.params.id as string;
const auth = useAuthStore();

const { data: ticket, error, refresh } = await useFetch<TicketDetail>(`/api/tickets/${ticketId}`);
const { data: comments, refresh: refreshComments } = await useFetch<Comment[]>(
  `/api/tickets/${ticketId}/comments`,
);
const { data: auditLog, refresh: refreshAuditLog } = await useFetch<AuditEntry[]>(
  `/api/tickets/${ticketId}/audit-log`,
);

const assigning = ref(false);
const actionError = ref('');
const newComment = ref('');
const postingComment = ref(false);

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

function slaIndicatorInfo(t: { slaDueAt: string; status: TicketStatus }) {
  if (t.status === 'RESOLVED' || t.status === 'CLOSED') return null;
  const due = new Date(t.slaDueAt).getTime();
  const now = Date.now();
  if (due < now) return { label: 'Vencido', style: 'bg-red-100 text-red-700' };
  if (due - now <= 60 * 60 * 1000) return { label: 'Vence pronto', style: 'bg-amber-100 text-amber-700' };
  return null;
}

const slaIndicator = computed(() => (ticket.value ? slaIndicatorInfo(ticket.value) : null));

async function assign() {
  assigning.value = true;
  actionError.value = '';
  try {
    await $fetch(`/api/tickets/${ticketId}/assign`, { method: 'PATCH' });
    await Promise.all([refresh(), refreshAuditLog()]);
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    actionError.value = fetchError.data?.statusMessage ?? 'No se pudo asignar el ticket';
  } finally {
    assigning.value = false;
  }
}

async function changeStatus(status: string) {
  actionError.value = '';
  try {
    await $fetch(`/api/tickets/${ticketId}/status`, { method: 'PATCH', body: { status } });
    await Promise.all([refresh(), refreshAuditLog()]);
  } catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } };
    actionError.value = fetchError.data?.statusMessage ?? 'No se pudo cambiar el estado';
  }
}

function onStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value) changeStatus(value);
}

async function submitComment() {
  if (!newComment.value.trim()) return;
  postingComment.value = true;
  try {
    await $fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: { body: newComment.value },
    });
    newComment.value = '';
    await refreshComments();
  } catch {
    actionError.value = 'No se pudo enviar el comentario';
  } finally {
    postingComment.value = false;
  }
}
</script>
