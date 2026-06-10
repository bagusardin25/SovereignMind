'use client';

import { motion } from 'framer-motion';

interface FeatureAgentCardProps {
  id: string;
  title: string;
  description: string;
  colorVar: string;
  delay: string;
  icon: React.ReactNode;
  animationClass: string;
  features: { name: string; statusClass?: string; progressClass: string }[];
}

export default function FeatureAgentCard({
  id,
  title,
  description,
  colorVar,
  delay,
  icon,
  animationClass,
  features,
}: FeatureAgentCardProps) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} className="h-full">
      <div 
        className={`h-full glass-dark p-8 rounded-3xl relative overflow-hidden group border border-white/5 transition-all duration-500 hover:-translate-y-3 shadow-lg ${animationClass}`} 
        style={{ 
          animationDelay: delay,
          '--hover-border-color': `var(${colorVar})`,
          '--hover-shadow-color': `rgba(var(${colorVar}-rgb), 0.1)` 
        } as React.CSSProperties}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .group:hover {
            border-color: color-mix(in srgb, var(${colorVar}) 50%, transparent);
            box-shadow: 0 20px 40px color-mix(in srgb, var(${colorVar}) 10%, transparent);
          }
        `}} />
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(to bottom right, transparent, color-mix(in srgb, var(${colorVar}) 5%, transparent))` }}
        ></div>
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110">
          {icon}
        </div>
        <div className="font-label-caps text-label-caps mb-2" style={{ color: `var(${colorVar})` }}>{id}</div>
        <h3 className="font-display-lg text-[32px] mb-6 text-white">{title}</h3>
        <p className="font-body-md text-body-md text-white/80 mb-8">
          {description}
        </p>
        <div className="space-y-4">
          {features.map((feature, idx) => (
            <div key={idx}>
              <div className="flex justify-between font-label-caps text-label-caps text-white/60 mb-2">
                <span>{feature.name}</span>
                <span className={feature.statusClass || ''} style={{ color: `var(${colorVar})` }}>Active</span>
              </div>
              <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                <div 
                  className={`h-full ${feature.progressClass} rounded-full`}
                  style={{ 
                    backgroundColor: `var(${colorVar})`,
                    boxShadow: `0 0 10px var(${colorVar})`,
                    opacity: feature.progressClass.includes('70') ? 0.7 : 1
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
