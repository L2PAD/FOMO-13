import React, { useEffect, useState } from "react";

interface UseScrollHandlerProps {
  projectsLength: number;
  rowHeight?: number;
  extraBottomSpace?: number;
}

export const useScrollHandler = ({
  projectsLength,
  rowHeight = 82,
  extraBottomSpace = 400,
}: UseScrollHandlerProps) => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToTop = () => {
    const header = document.getElementById("scroll-header");
    if (header) {
      header.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;

    const isBottom = rowHeight * projectsLength + extraBottomSpace < scrollTop;
    const threshold = rowHeight * 15;

    setShowScrollButton(scrollTop > threshold && !isBottom);
  };

  useEffect(() => {
    document.body.addEventListener("scroll", handleScroll);

    return () => {
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, [projectsLength, rowHeight, extraBottomSpace]);

  return { showScrollButton, scrollToTop };
};
