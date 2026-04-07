import { cn } from "@/lib/utils";
import { Button } from "@/components/menarium/Button";
import { LinkButton } from "@/components/menarium/LinkButton";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-4",
        className
      )}
    >
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {children}
      {actionLabel && (actionHref ? (
        <LinkButton
          href={actionHref}
          variant="primary"
          className="mt-2 !px-5 !py-2.5 !text-sm"
        >
          {actionLabel}
        </LinkButton>
      ) : onAction ? (
        <Button
          size="sm"
          variant="primary"
          className="mt-2 !px-5 !py-2.5 !text-sm"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null)}
    </div>
  );
}
