"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  role: string;
};

export function HeaderMenu({ role }: Props) {
  const [open, setOpen] = useState(false);

  const isGestor = role === "GESTOR";
  const isRh = role === "RH";

  if (!isGestor && !isRh) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Abrir menu"
      >
        <span className="sr-only">Abrir menu</span>
        <span className="flex flex-col gap-[3px]">
          <span className={cn("h-[2px] w-4 rounded-full bg-current transition", open && "translate-y-[5px] rotate-45")} />
          <span className={cn("h-[2px] w-4 rounded-full bg-current transition", open && "opacity-0")} />
          <span className={cn("h-[2px] w-4 rounded-full bg-current transition", open && "-translate-y-[5px] -rotate-45")} />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Navegação
          </p>

          {isGestor && (
            <div className="space-y-2">
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                <p className="font-semibold">Visão Gestor</p>
                <p>Você está vendo apenas o seu time, em ordem das próximas férias.</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Suas próprias solicitações aparecem no card de <strong>Nova Solicitação / Minhas Solicitações</strong>.
              </p>
            </div>
          )}

          {isRh && (
            <div className="space-y-2">
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
                <p className="font-semibold">Visão RH</p>
                <p>As solicitações estão agrupadas por gestor. Use a busca e o filtro de status para refinar.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

