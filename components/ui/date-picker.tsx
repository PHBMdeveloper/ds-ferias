"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Props = {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DatePicker({ value, onChange, placeholder, disabled }: Props) {
  const label = value
    ? value.toLocaleDateString("pt-BR")
    : placeholder ?? "Selecionar data";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between text-left font-normal min-h-[44px]"
        >
          <span className={value ? "" : "text-[#94a3b8]"}>{label}</span>
          <span className="ml-2 text-xs text-[#64748b] dark:text-slate-400">
            Abrir
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => onChange(d ?? undefined)}
          numberOfMonths={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

