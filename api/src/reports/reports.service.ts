import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface SlaReportRow {
  agentId: string;
  agentName: string;
  resolvedCount: number;
  pctWithinSla: number;
  avgResolutionBusinessHours: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  getSlaReport(orgId: string): Promise<SlaReportRow[]> {
    return this.prisma.$queryRaw<SlaReportRow[]>`
      WITH resolutions AS (
        SELECT DISTINCT ON (ticket_id)
          ticket_id,
          created_at AS resolved_at
        FROM audit_log
        WHERE action = 'STATUS_CHANGED' AND new_value = 'RESOLVED'
        ORDER BY ticket_id, created_at DESC
      ),
      resolved_tickets AS (
        SELECT
          t.id,
          t.agent_id,
          t.created_at,
          t.sla_due_at,
          r.resolved_at,
          (t.created_at - interval '5 hours') AS created_at_bogota,
          (r.resolved_at - interval '5 hours') AS resolved_at_bogota
        FROM tickets t
        JOIN resolutions r ON r.ticket_id = t.id
        WHERE t.org_id = ${orgId}::uuid
          AND t.status IN ('RESOLVED', 'CLOSED')
          AND t.agent_id IS NOT NULL
          AND t.created_at >= now() - interval '30 days'
      ),
      days AS (
        SELECT rt.id AS ticket_id, d::date AS day
        FROM resolved_tickets rt,
             generate_series(rt.created_at_bogota::date, rt.resolved_at_bogota::date, interval '1 day') AS d
      ),
      business_minutes AS (
        SELECT
          days.ticket_id,
          SUM(
            GREATEST(0, EXTRACT(EPOCH FROM (
              LEAST(rt.resolved_at_bogota, (days.day + bh.end_time)::timestamp)
              - GREATEST(rt.created_at_bogota, (days.day + bh.start_time)::timestamp)
            )) / 60)
          ) AS minutes
        FROM days
        JOIN resolved_tickets rt ON rt.id = days.ticket_id
        JOIN business_hours bh ON bh.day_of_week = EXTRACT(DOW FROM days.day)
        WHERE NOT EXISTS (SELECT 1 FROM holidays h WHERE h.date_day = days.day)
        GROUP BY days.ticket_id
      )
      SELECT
        u.id AS "agentId",
        u.name AS "agentName",
        COUNT(*)::int AS "resolvedCount",
        ROUND(100.0 * COUNT(*) FILTER (WHERE rt.resolved_at <= rt.sla_due_at) / COUNT(*), 1)::float AS "pctWithinSla",
        ROUND(AVG(bm.minutes) / 60, 2)::float AS "avgResolutionBusinessHours"
      FROM resolved_tickets rt
      JOIN users u ON u.id = rt.agent_id
      LEFT JOIN business_minutes bm ON bm.ticket_id = rt.id
      GROUP BY u.id, u.name
      ORDER BY u.name
    `;
  }
}
