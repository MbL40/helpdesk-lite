<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900">Reporte de SLA</h1>
    <p class="text-sm text-gray-500">Últimos 30 días, por agente.</p>

    <p v-if="error" role="alert" class="text-sm text-red-600">No se pudo cargar el reporte.</p>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Agente</th>
            <th class="px-4 py-3 font-medium">Tickets resueltos</th>
            <th class="px-4 py-3 font-medium">% dentro de SLA</th>
            <th class="px-4 py-3 font-medium">Promedio (horas hábiles)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in rows" :key="row.agentId">
            <td class="px-4 py-3 text-gray-900">{{ row.agentName }}</td>
            <td class="px-4 py-3 text-gray-500">{{ row.resolvedCount }}</td>
            <td class="px-4 py-3 text-gray-500">{{ row.pctWithinSla }}%</td>
            <td class="px-4 py-3 text-gray-500">{{ row.avgResolutionBusinessHours }}h</td>
          </tr>
          <tr v-if="rows && rows.length === 0">
            <td colspan="4" class="px-4 py-6 text-center text-gray-400">
              Sin tickets resueltos en los últimos 30 días.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
if (auth.user?.role !== 'ADMIN') {
  await navigateTo('/tickets');
}

interface SlaReportRow {
  agentId: string;
  agentName: string;
  resolvedCount: number;
  pctWithinSla: number;
  avgResolutionBusinessHours: number;
}

const { data: rows, error } = await useFetch<SlaReportRow[]>('/api/reports/sla');
</script>