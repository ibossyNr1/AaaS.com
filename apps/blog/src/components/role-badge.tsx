import { Badge } from "@aaas/ui";
import { cn } from "@aaas/ui";
import { getRoleLabel, getRoleBadgeColor, type Role } from "@/lib/rbac";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md";
}

/**
 * Color-coded badge displaying a workspace role.
 */
export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const colorClasses = getRoleBadgeColor(role);

  return (
    <Badge
      variant="circuit"
      className={cn(
        colorClasses,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-3 py-1 text-xs"
      )}
    >
      {getRoleLabel(role)}
    </Badge>
  );
}
