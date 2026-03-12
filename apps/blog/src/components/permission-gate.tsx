"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { canPerformAction, type Permission } from "@/lib/rbac";

interface PermissionGateProps {
  permission: Permission;
  workspaceId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children only when the current user holds
 * the required permission in the given workspace.
 */
export function PermissionGate({
  permission,
  workspaceId,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAllowed(false);
      setChecking(false);
      return;
    }

    let cancelled = false;

    canPerformAction(user.uid, workspaceId, permission).then((result) => {
      if (!cancelled) {
        setAllowed(result);
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, workspaceId, permission]);

  if (authLoading || checking) return null;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
