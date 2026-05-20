"use client";

import { useEffect, useRef } from "react";

export function useClickOutside(ref, onOutsideClick) {
  const onOutsideClickRef = useRef(onOutsideClick);

  useEffect(() => {
    onOutsideClickRef.current = onOutsideClick;
  }, [onOutsideClick]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClickRef.current(event);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);
}
