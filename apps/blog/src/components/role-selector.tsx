"use client";

import { cn } from "@aaas/ui";
import {
  ROLE_HIERARCHY,
  getRoleLabel,
  isRoleHigherOrEqual,
  type Role,
} from "@/lib/rbac";

interface RoleSelectorProps {
  currentRole: Role;
  onChange: (role: Role) => void;
  /** The highest role the current actor can assign. */
  maxRole: Role;
  disabled?: boolean;
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control including billing",
  admin: "Manage members, settings, and content",
  editor: "Create and edit content",
  viewer: "Read-only access",
};

/**
 * Dropdown for selecting a workspace role.
 * Only roles at or below `maxRole` in the hierarchy are shown.
 */
export function RoleSelector({
  currentRole,
  onChange,
  maxRole,
  disabled = false,
}: RoleSelectorProps) {
  // Only show roles at or below maxRole in the hierarchy
  const selectableRoles = ROLE_HIERARCHY.filter((role) =>
    isRoleHigherOrEqual(maxRole, role)
  );

  return (
    <div className="relative">
      <select
        value={currentRole}
        onChange={(e) => onChange(e.target.value as Role)}
        disabled={disabled}
        className={cn(
          "w-full appearance-none rounded border border-border bg-surface px-3 py-2",
          "font-mono text-sm text-text",
          "focus:border-circuit focus:outline-none focus:ring-1 focus:ring-circuit/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {selectableRoles.map((role) => (
          <option key={role} value={role}>
            {getRoleLabel(role)} — {ROLE_DESCRIPTIONS[role]}
          </option>
        ))}
      </select>

      {/* Chevron indicator */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
