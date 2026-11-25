"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Controlled external search value (for example from URL `q` param). */
  value?: string;
  /** Called after `debounceMs` when the user edits the input. */
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function SearchInput({
  value = "",
  onValueChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  debounceMs = 300,
  className,
  disabled = false,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const lastEmittedRef = useRef(value);

  // Sync external resets (e.g. "Clear filters") into local input state.
  useEffect(() => {
    setInputValue(value);
    lastEmittedRef.current = value;
  }, [value]);

  // Notify parent only when the debounced value actually differs from last synced value.
  useEffect(() => {
    const trimmedDebounced = debouncedValue.trim();
    const trimmedLast = lastEmittedRef.current.trim();
    if (trimmedDebounced !== trimmedLast) {
      lastEmittedRef.current = debouncedValue;
      onValueChange(trimmedDebounced);
    }
  }, [debouncedValue, onValueChange]);

  function handleClear() {
    setInputValue("");
    lastEmittedRef.current = "";
    onValueChange("");
  }

  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn("pl-10", inputValue ? "pr-9" : undefined)}
      />
      {inputValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 size-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
