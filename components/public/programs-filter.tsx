"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/types/api";

export interface ProgramsFilterProps {
  departments: Department[];
  initialQuery?: string;
  initialDepartmentId?: string;
}

export function ProgramsFilter({
  departments,
  initialQuery = "",
  initialDepartmentId = "",
}: ProgramsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const selectedDept = initialDepartmentId || "all";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentQ = searchParams.get("q") ?? "";
      if (query.trim() === currentQ) return;

      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  function handleDepartmentChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("departmentId", value);
    } else {
      params.delete("departmentId");
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }

  function handleReset() {
    setQuery("");
    router.replace(pathname);
  }

  const hasFilters = Boolean(query.trim() || initialDepartmentId);

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search degree programs by name or code..."
          aria-label="Search degree programs"
          className="pl-10"
        />
      </div>

      <Select value={selectedDept} onValueChange={handleDepartmentChange}>
        <SelectTrigger
          className="w-full sm:w-64"
          aria-label="Filter by department"
        >
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.code} — {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
