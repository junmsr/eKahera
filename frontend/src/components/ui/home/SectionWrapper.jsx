import React from "react";

/**
 * Lightweight section wrapper to keep ARIA + layout boilerplate consistent.
 * Props:
 *  - id: section id (used for anchors)
 *  - title: visible to screen readers (renders sr-only h2); omit to skip heading
 *  - className: additional classes for layout
 *  - children: section content
 */
function SectionWrapper({ id, title, children, className = "" }) {
  const headingId = title ? `${id || "section"}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`px-4 ${className}`}
    >
      {title && (
        <h2 id={headingId} className="sr-only">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export default SectionWrapper;
