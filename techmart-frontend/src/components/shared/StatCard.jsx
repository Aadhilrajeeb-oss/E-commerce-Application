import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 pointer-events-none">
        <Icon size={120} />
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gray-800 rounded-xl text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Icon size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        </div>
        
        <div>
          <p className="text-3xl font-bold text-gray-100">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
