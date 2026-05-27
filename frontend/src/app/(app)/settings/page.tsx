'use client';

// ============================================================
// Settings Page
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Save, ShieldAlert, Clock, Bell, ChevronDown } from 'lucide-react';

export default function SettingsPage() {
  const [riskThreshold, setRiskThreshold] = useState(75);
  const [rebalanceInterval, setRebalanceInterval] = useState('daily');
  const [notifications, setNotifications] = useState({
    email: true,
    slack: false,
    telegram: true,
    urgentOnly: false
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const intervalOptions = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'manual', label: 'Manual Only' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    // Mock save functionality
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">System Settings</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            Configure agent behaviors, risk parameters, and notifications.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[--color-agent-ceo] hover:bg-[--color-agent-ceo]/80 text-white rounded-xl font-medium transition-colors"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Global Risk Threshold */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-cfo]/10 flex items-center justify-center text-[--color-agent-cfo]">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Global Risk Threshold</h3>
                <p className="text-xs text-[--color-muted-foreground]">Maximum acceptable risk score before CFO intervention</p>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[--color-muted-foreground]">Conservative (0)</span>
                <span className="text-[--color-agent-cfo] font-bold">{riskThreshold}/100</span>
                <span className="text-[--color-muted-foreground]">Aggressive (100)</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[--color-agent-cfo]"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Rebalance Interval */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-ceo]/10 flex items-center justify-center text-[--color-agent-ceo]">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Rebalance Interval</h3>
                <p className="text-xs text-[--color-muted-foreground]">How often agents evaluate and adjust treasury positions</p>
              </div>
            </div>
            
            <div className="pt-2 relative w-full md:w-1/2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 bg-white/5 border border-[--color-border] rounded-xl text-left text-white outline-none focus:border-[--color-agent-ceo] hover:bg-white/10 transition-colors flex justify-between items-center shadow-sm"
              >
                <span>{intervalOptions.find(o => o.value === rebalanceInterval)?.label}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 text-[--color-muted-foreground] ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 w-full mt-2 py-2 glass bg-[#0f141b]/95 border border-[--color-border] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    {intervalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRebalanceInterval(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          rebalanceInterval === option.value 
                            ? 'bg-[--color-agent-ceo]/20 text-[--color-agent-ceo-light]' 
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-cmo]/10 flex items-center justify-center text-[--color-agent-cmo]">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <p className="text-xs text-[--color-muted-foreground]">Manage how you receive alerts from the agent guild</p>
              </div>
            </div>
            
            <div className="pt-2 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Email Alerts</div>
                  <div className="text-xs text-[--color-muted-foreground]">Receive daily summaries and critical alerts via email</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${notifications.email ? 'bg-[--color-agent-cmo]' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.email ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Slack Integration</div>
                  <div className="text-xs text-[--color-muted-foreground]">Send agent decisions to a designated Slack channel</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.slack} onChange={(e) => setNotifications({...notifications, slack: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${notifications.slack ? 'bg-[--color-agent-cmo]' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.slack ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Telegram Bot</div>
                  <div className="text-xs text-[--color-muted-foreground]">Instant notifications via Telegram</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.telegram} onChange={(e) => setNotifications({...notifications, telegram: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${notifications.telegram ? 'bg-[--color-agent-cmo]' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.telegram ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
              
              <div className="pt-4 border-t border-white/5">
                 <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-white">Urgent Alerts Only</div>
                    <div className="text-xs text-[--color-muted-foreground]">Only notify on high-risk events or large transactions</div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={notifications.urgentOnly} onChange={(e) => setNotifications({...notifications, urgentOnly: e.target.checked})} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${notifications.urgentOnly ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.urgentOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
