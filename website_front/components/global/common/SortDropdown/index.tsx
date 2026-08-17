import React, { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import {
  SortDropdownMenu,
  SortDropdownMenuItem,
  SortDropdownWrapper,
} from "./styles";
import { useTranslation } from "i18n";

export interface SortDropdownOption {
  label: string;
  value: string;
}

interface SortDropdownProps {
  value?: string | null;
  options: SortDropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

const SortDropdown = ({
  value,
  options,
  onChange,
  label = "Sort",
  icon,
  className,
}: SortDropdownProps) => {
  const { translateText } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      if (!buttonRef.current) return;

      const viewportGap = 8;
      const menuGap = 8;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = Math.min(
        Math.max(220, buttonRect.width),
        window.innerWidth - viewportGap * 2
      );
      const estimatedMenuHeight = Math.min(options.length * 40 + 16, 320);
      const menuHeight = menuRef.current?.offsetHeight || estimatedMenuHeight;
      const canOpenBelow =
        buttonRect.bottom + menuGap + menuHeight <=
        window.innerHeight - viewportGap;
      const canOpenAbove = buttonRect.top - menuGap - menuHeight >= viewportGap;
      const top =
        canOpenBelow || !canOpenAbove
          ? Math.min(
              buttonRect.bottom + menuGap,
              window.innerHeight - viewportGap - menuHeight
            )
          : buttonRect.top - menuGap - menuHeight;
      const unclampedCenter = buttonRect.left + buttonRect.width / 2;
      const left = Math.min(
        Math.max(unclampedCenter, viewportGap + menuWidth / 2),
        window.innerWidth - viewportGap - menuWidth / 2
      );

      setMenuStyle({
        position: "fixed",
        top: `${Math.max(viewportGap, top)}px`,
        left: `${left}px`,
        width: `${menuWidth}px`,
        zIndex: 3000,
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isTriggerClick = wrapperRef.current?.contains(target);
      const isMenuClick = menuRef.current?.contains(target);

      if (!isTriggerClick && !isMenuClick) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const closeOnScroll = (event: Event) => {
      const target = event.target;

      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const closeOnResize = () => setIsOpen(false);
    const animationFrame = window.requestAnimationFrame(() => {
      updateMenuPosition();

      const selectedItem = menuRef.current?.querySelector<HTMLButtonElement>(
        '[aria-checked="true"]'
      );
      const firstItem =
        menuRef.current?.querySelector<HTMLButtonElement>("button");
      (selectedItem || firstItem)?.focus();
    });

    updateMenuPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnResize);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnResize);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [isOpen, options.length]);

  const menu =
    isOpen && menuStyle ? (
      <SortDropdownMenu ref={menuRef} role="menu" style={menuStyle}>
        {options.map((option) => (
          <SortDropdownMenuItem
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={value === option.value}
            active={value === option.value}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
              buttonRef.current?.focus();
            }}
          >
            <span>{translateText(option.label)}</span>
            {value === option.value ? <Check size={14} /> : null}
          </SortDropdownMenuItem>
        ))}
      </SortDropdownMenu>
    ) : null;

  return (
    <SortDropdownWrapper className={className} ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {icon}
        {translateText(label)}
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </SortDropdownWrapper>
  );
};

export default SortDropdown;
