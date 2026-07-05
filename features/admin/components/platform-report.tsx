import { Bot, FileWarning, MessagesSquare, Timer, Users, Wrench } from "lucide-react";

import { StatCard } from "@/features/analytics/components/stat-card";
import { formatCount, formatResponseTime } from "@/features/analytics/lib/format";
import type { PlatformReport as PlatformReportData } from "../queries";
import { ExportReportLinks } from "./export-report-links";

export function PlatformReport({ report }: { report: PlatformReportData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ExportReportLinks />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={formatCount(report.totalUsers)} />
        <StatCard icon={Bot} label="Total agents" value={formatCount(report.totalAgents)} />
        <StatCard
          icon={MessagesSquare}
          label="Total conversations"
          value={formatCount(report.totalConversations)}
        />
        <StatCard icon={MessagesSquare} label="Total messages" value={formatCount(report.totalMessages)} />
        <StatCard icon={Wrench} label="Tool calls made" value={formatCount(report.totalToolCalls)} />
        <StatCard
          icon={Timer}
          label="Avg. response time"
          value={formatResponseTime(report.avgResponseTimeMs)}
        />
        <StatCard
          icon={FileWarning}
          label="Documents processed"
          value={`${formatCount(report.totalDocuments)} (${report.failedDocuments} failed)`}
        />
      </div>
    </div>
  );
}
