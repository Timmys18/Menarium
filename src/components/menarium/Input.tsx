"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface MenariumInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Режим поиска: поле с иконкой слева */
  search?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, MenariumInputProps>(
  (
    {
      className,
      id,
      label,
      helperText,
      error,
      search,
      disabled,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = cn(ariaDescribedBy, helperId, errorId) || undefined;

    const field = (
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-3 rounded-2xl border border-input bg-card/40 px-4 py-3 text-foreground shadow-sm transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          error && "border-destructive focus-within:ring-destructive",
          disabled && "cursor-not-allowed opacity-50",
          search && "pl-3"
        )}
      >
        {search ? (
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>
    );

    if (!label && !helperText && !error) {
      return field;
    }

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        ) : null}
        {field}
        {helperText && !error ? (
          <p id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "MenariumInput";
