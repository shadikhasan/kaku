"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CircleHelp, Menu, Settings2, X } from "lucide-react";
import { useI18n } from "./language-provider";
import { usePwa } from "./pwa-provider";

export function MobileMenu({ onHelp }: { onHelp: () => void }) {
  const { t } = useI18n();
  const pwa = usePwa();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => dialog.current?.close();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = matchMedia("(min-width: 761px)");
    const resized = () => {
      if (desktop.matches) dialog.current?.close();
    };
    desktop.addEventListener("change", resized);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener("change", resized);
    };
  }, [open]);

  const install = () => {
    close();
    if (pwa.prompt && !pwa.dismissed) void pwa.install();
    else router.push("/settings/?install=1#pwa-heading");
  };

  return (
    <>
      <button
        className="icon-button mobile-more-button"
        aria-label={t("More options")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="mobile-more-dialog"
        aria-labelledby="mobile-more-heading"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="mobile-more-inner">
          <header>
            <h2 id="mobile-more-heading">{t("More")}</h2>
            <button
              className="icon-button"
              aria-label={t("Close dialog")}
              onClick={close}
            >
              <X size={21} />
            </button>
          </header>
          <nav aria-label={t("More options")}>
            <Link href="/settings/" onClick={close}>
              <Settings2 size={20} aria-hidden="true" />
              <span>{t("Settings")}</span>
            </Link>
            <button
              onClick={() => {
                close();
                onHelp();
              }}
            >
              <CircleHelp size={20} aria-hidden="true" />
              <span>{t("Help")}</span>
            </button>
            {!pwa.installed && (
              <button onClick={install}>
                <ArrowDownToLine size={20} aria-hidden="true" />
                <span>{t("Install Kaku")}</span>
              </button>
            )}
          </nav>
        </div>
      </dialog>
    </>
  );
}
