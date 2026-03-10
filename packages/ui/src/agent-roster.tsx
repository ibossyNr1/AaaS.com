import { cn } from "./cn";

interface Agent {
  name: string;
  role: string;
  status: "active" | "idle" | "learning";
  model?: string;
}

const statusConfig = {
  active: { dot: "bg-emerald-400 animate-pulse-dot", label: "Active" },
  idle: { dot: "bg-text-muted", label: "Idle" },
  learning: { dot: "bg-circuit animate-heartbeat", label: "Learning" },
};

interface AgentRosterProps {
  agents: Agent[];
  className?: string;
}

export function AgentRoster({ agents, className }: AgentRosterProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {agents.map((agent) => {
        const config = statusConfig[agent.status];
        return (
          <div
            key={agent.name}
            className="glass rounded-lg p-4 flex items-center gap-4 group hover:border-circuit/20 transition-all duration-300"
          >
            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", config.dot)} />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-text font-medium truncate">
                {agent.name}
              </div>
              <div className="text-xs text-text-muted truncate">{agent.role}</div>
            </div>
            {agent.model && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-circuit/60 bg-circuit/5 px-2 py-0.5 rounded">
                {agent.model}
              </span>
            )}
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
