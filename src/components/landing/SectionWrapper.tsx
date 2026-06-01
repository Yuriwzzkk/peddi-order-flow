import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  id?: string;
  className?: string;
}

export function SectionWrapper({ children, id, className = "" }: Props) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative z-10 py-24 lg:py-32 ${className}`}
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-16">
        {children}
      </div>
    </motion.section>
  );
}
