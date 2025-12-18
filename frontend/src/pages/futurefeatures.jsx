import React from "react";
import { motion } from "framer-motion";
import {
  Store,
  RefreshCcw,
  Smartphone,
  Package,
  Users,
  CreditCard,
  Gift,
  Truck,
} from "lucide-react";

const FutureFeatures = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const features = [
    {
      icon: Store,
      title: "Multi-Branch / Multi-Store Management",
      description:
        "Manage multiple store locations and branches seamlessly with centralized control and real-time synchronization.",
    },
    {
      icon: RefreshCcw,
      title: "Advanced Transaction Features",
      description:
        "Handle voids, refunds, and returns with full audit trails, approvals, and detailed reporting.",
    },
    {
      icon: Smartphone,
      title: "Native Mobile Application",
      description:
        "Operate your POS on-the-go with optimized iOS and Android mobile applications.",
    },
    {
      icon: Package,
      title: "Inventory Enhancements",
      description:
        "Track expiration dates, manage bundled products, and reduce inventory waste efficiently.",
    },
    {
      icon: Users,
      title: "Cashier Performance & Shift Management",
      description:
        "Analyze cashier productivity, manage shifts, and monitor performance metrics in real time.",
    },
    {
      icon: CreditCard,
      title: "Card Payment Integration",
      description:
        "Accept secure card payments with seamless payment gateway integration.",
    },
    {
      icon: Gift,
      title: "Promotional Tools",
      description:
        "Launch discounts, promos, and loyalty programs to increase customer retention.",
    },
    {
      icon: Truck,
      title: "Supplier Management",
      description:
        "Track suppliers, automate restocking, and analyze supplier performance.",
    },
  ];

  return (
    <section className="w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 py-20 px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent mb-6">
            Future Features
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed">
            Discover the exciting features we're building to elevate your POS
            system and scale your business with confidence.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"></div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group relative rounded-2xl backdrop-blur-sm bg-white/70 border border-white/20 p-6 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:bg-white/90"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6 shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon size={28} />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                  {feature.description}
                </p>

                {/* Decorative hover glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-500 group-hover:ring-blue-400/50 group-hover:shadow-blue-500/20" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FutureFeatures;
