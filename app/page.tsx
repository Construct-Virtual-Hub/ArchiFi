"use client";

import { motion } from "framer-motion";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  BarChart3, 
  DollarSign, 
  PieChart,
  ArrowRight,
  CheckCircle,
  Zap
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto px-6 py-8"
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">ARCHIFI</h1>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </motion.header>
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6"
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Next-Gen Architecture Finance</span>
          </motion.div>
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Financial
            <span className="block text-blue-600">Architecture</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Comprehensive financial management platform designed for modern enterprises.
            Streamline operations, optimize performance, and drive growth.
          </p>
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </section>
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights and comprehensive reporting" },
            { icon: DollarSign, title: "Financial Planning", desc: "Advanced forecasting and budget management" },
            { icon: Users, title: "Team Collaboration", desc: "Seamless workflow with your entire team" },
            { icon: PieChart, title: "Portfolio Management", desc: "Diversified investment strategies" },
            { icon: TrendingUp, title: "Growth Tracking", desc: "Monitor performance and ROI metrics" },
            { icon: Building2, title: "Enterprise Ready", desc: "Scalable solutions for large organizations" },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "$2B+", label: "Assets Managed" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of companies already using ARCHIFI to transform their financial operations.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Start Your Free Trial
          </motion.button>
        </motion.div>
      </section>
      <footer className="border-t border-gray-200 py-8 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">ARCHIFI</span>
            </div>
            <p className="text-gray-600 text-sm">
              Â© 2025 ARCHIFI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}