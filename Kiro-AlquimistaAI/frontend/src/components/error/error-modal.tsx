'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

export type ErrorSeverity = 'error' | 'warning' | 'critical';

export interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  severity?: ErrorSeverity;
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
  details?: string;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-yellow-600',
    titleClass: 'text-yellow-600',
  },
  critical: {
    icon: XCircle,
    iconClass: 'text-red-600',
    titleClass: 'text-red-600',
  },
};

/**
 * Modal para exibir erros que requerem ação do usuário
 * Usado para erros críticos ou que necessitam confirmação
 */
export function ErrorModal({
  open,
  onOpenChange,
  title,
  message,
  severity = 'error',
  actionLabel = 'OK',
  onAction,
  cancelLabel,
  details,
}: ErrorModalProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${config.iconClass}`} />
            <DialogTitle className={config.titleClass}>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{message}</DialogDescription>
        </DialogHeader>

        {details && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-mono text-muted-foreground">{details}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {cancelLabel && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          )}
          <Button onClick={handleAction}>{actionLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
