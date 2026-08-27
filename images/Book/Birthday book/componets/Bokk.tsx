"use client";

import { useLayoutEffect, useRef } from "react";
import { PageFlip } from "page-flip";

const pages = Array.from({ length: 14 }, (_, index) => index + 1);

export default function Book() {
  const bookRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let pageFlip: PageFlip | undefined;
    const timeout = window.setTimeout(() => {
      const book = bookRef.current;
      if (!book) return;

      pageFlip = new PageFlip(book, {
        width: 960,
        height: 1313,
        size: "stretch",
        minWidth: 280,
        maxWidth: 960,
        minHeight: 380,
        maxHeight: 1313,
        autoSize: false,
        showCover: true,
        drawShadow: false,
        maxShadowOpacity: 0.5,
        usePortrait: false,
        startPage: 0,
        mobileScrollSupport: true,
      });

      pageFlip.loadFromHTML(book.querySelectorAll(".book-page"));
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      pageFlip?.destroy();
    };
  }, []);

  return (
    <div ref={bookRef} className="h-full w-full max-w-full">
      {pages.map((pageNumber) => (
        <div
          key={pageNumber}
          className="book-page relative overflow-hidden bg-white"
          data-density={pageNumber === 1 || pageNumber === 14 ? "hard" : "soft"}
          style={{ width: 738, height: 1010 }}
        >
          <img
            src={`/images/page-${pageNumber}.png`}
            alt={`Birthday book page ${pageNumber}`}
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain"
          />
        </div>
      ))}
    </div>
  );
}
