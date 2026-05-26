import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

export default function StatCard({ title, value, description, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colorClass} text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">{value}</h3>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
