import React from "react";
import { motion } from "framer-motion";

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
  const container = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

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
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2, margin: "-80px" }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export default SectionWrapper;
