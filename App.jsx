// src/App.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { countries } from './countryData';
import LeftDrawer from './components/LeftDrawer';
import RightDrawer from './components/RightDrawer';
import ActiveWorkspace from './components/ActiveWorkspace';

// Helper to reliably find a timezone's UTC offset (in minutes) at any specific date/time
// Exported so ActiveWorkspace can utilize it for time conversions
export const getTzOffsetMins = (dateObj, timeZone) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    const parts = fmt.formatToParts(dateObj);
    const p = {};
    parts.forEach(part => p[part.type] = part.value);
    
    const hr = p.hour === '24' ? '00' : p.hour;
    const isoString = `${p.year}-${p.month.padStart(2, '0')}-${p.day.padStart(2, '0')}T${hr.padStart(2, '0')}:${p.minute.padStart(2, '0')}:${p.second.padStart(2, '0')}Z`;
    
    const tzDate = new Date(isoString);
    return Math.round((tzDate - dateObj) / 60000);
  } catch (e) {
    return 0; // Fallback
  }
};

const defaultScripts = {
  "Greet": "Hello, good day! May I please speak with [Respondent Name]?",
  "Introduce": "My name is [Your Name] calling on behalf of IRS Research. I hope you are having a productive week.",
  "Explain Purpose": "We are conducting a brief research study regarding global market trends and technology distributions, and your perspectives would be highly valuable.",
  "Call Monitoring & Right to Privacy Disclaimer": "Before we begin, please note that this call may be monitored or recorded for quality and training purposes. You have the right to object or opt-out at any point.",
  "E-Mail Confirmation": "Could you kindly verify or provide the best email address where we can send the study summary confirmation documents?",
  "Survey": "Great, thank you. Let's move into our first milestone item: How would you evaluate your team's operational adaptation timeline?",
  "Closing Privacy Disclaimer": "As a respondent located within the regulated zone, please note your personal records are securely managed under our localized data rights compliance policies. You can request erasure at any time.",
  "Thanks and Regards": "Thank you so much for your time and premium insights today. Have an excellent rest of your day ahead! Goodbye."
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All"); 
  const [ticker, setTicker] = useState(Date.now());
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);
  
  const [isFlowGuideExpanded, setIsFlowGuideExpanded] = useState(false);
  const [userNotes, setUserNotes] = useState(() => localStorage.getItem('userNotes_v1') || '');

  const canvasRef = useRef(null);

  const [completedSteps, setCompletedSteps] = useState([]);
  const [expandedSteps, setExpandedSteps] = useState([]);
  const [customScripts, setCustomScripts] = useState(() => {
    const saved = localStorage.getItem('callFlowScripts_v1');
    return saved ? JSON.parse(saved) : defaultScripts;
  });

  const [associateLocation, setAssociateLocation] = useState(() => localStorage.getItem('associateLoc_v2') || 'IN');
  const [selectedCountries, setSelectedCountries] = useState(() => {
    const saved = localStorage.getItem('selectedCountries');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointmentLogs, setAppointmentLogs] = useState(() => {
    const saved = localStorage.getItem('appointmentLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [callWindowStart, setCallWindowStart] = useState(() => parseInt(localStorage.getItem('callWindowStart')) || 9);
  const [callWindowEnd, setCallWindowEnd] = useState(() => parseInt(localStorage.getItem('callWindowEnd')) || 17);

  const [converterState, setConverterState] = useState({});

  const officeTimezones = {
    'IN': 'Asia/Kolkata',
    'US': 'America/New_York',
    'UK': 'Europe/London'
  };

  const officeLabels = {
    'IN': 'India',
    'US': 'United States (EST)',
    'UK': 'United Kingdom'
  };

  useEffect(() => localStorage.setItem('associateLoc_v2', associateLocation), [associateLocation]);
  useEffect(() => localStorage.setItem('selectedCountries', JSON.stringify(selectedCountries)), [selectedCountries]);
  useEffect(() => localStorage.setItem('appointmentLogs', JSON.stringify(appointmentLogs)), [appointmentLogs]);
  useEffect(() => localStorage.setItem('callWindowStart', callWindowStart.toString()), [callWindowStart]);
  useEffect(() => localStorage.setItem('callWindowEnd', callWindowEnd.toString()), [callWindowEnd]);
  useEffect(() => localStorage.setItem('callFlowScripts_v1', JSON.stringify(customScripts)), [customScripts]);
  useEffect(() => localStorage.setItem('userNotes_v1', userNotes), [userNotes]);

  useEffect(() => {
    const interval = setInterval(() => setTicker(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const processedCountries = useMemo(() => {
    return countries.map(country => {
      const currentAssociateTz = officeTimezones[associateLocation];
      const now = new Date();
      let localTimeString = "Error";
      let localHour = 0;
      let localMinute = 0;
      let callStatus = 'unavailable';
      let offsetText = "Unknown offset";
      let diffMins = 0;
      let waitMins = 0;

      try {
        const options = { timeZone: country.timezone, hour: 'numeric', minute: 'numeric', hour12: true };
        localTimeString = new Intl.DateTimeFormat('en-US', options).format(now);

        const parts24 = new Intl.DateTimeFormat('en-US', { timeZone: country.timezone, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
        const hrVal = parts24.find(p => p.type === 'hour')?.value;
        const mnVal = parts24.find(p => p.type === 'minute')?.value;
        
        localHour = parseInt(hrVal === '24' ? '0' : hrVal, 10);
        localMinute = parseInt(mnVal || '0', 10);

        const currentMins = localHour * 60 + localMinute;
        const startMins = callWindowStart * 60;
        const endMins = callWindowEnd * 60;

        if (currentMins >= startMins && currentMins < endMins) {
          callStatus = 'available';
          waitMins = 0;
        } else {
          if (currentMins >= (startMins - 120) && currentMins < startMins) {
            callStatus = 'soon';
          } else {
            callStatus = 'unavailable';
          }
          
          if (currentMins < startMins) {
            waitMins = startMins - currentMins;
          } else {
            waitMins = (24 * 60 - currentMins) + startMins;
          }
        }

        const associateOffsetNow = getTzOffsetMins(now, currentAssociateTz);
        const targetOffsetNow = getTzOffsetMins(now, country.timezone);
        diffMins = targetOffsetNow - associateOffsetNow;
        
        offsetText = "Same time zone";
        if (diffMins !== 0) {
          const hrs = Math.floor(Math.abs(diffMins) / 60);
          const mins = Math.abs(diffMins) % 60;
          let timeStr = '';
          if (hrs > 0) timeStr += `${hrs}h`;
          if (mins > 0) timeStr += ` ${mins}m`;
          offsetText = diffMins > 0 ? `${timeStr.trim()} ahead` : `${timeStr.trim()} behind`;
        }
      } catch (err) {
        console.warn(`Timezone validation failed for ${country.name}`);
      }
      return { ...country, localTimeString, callStatus, offsetText, diffMins, waitMins };
    });
  }, [ticker, associateLocation, callWindowStart, callWindowEnd]);

  const filteredForDrawer = useMemo(() => {
    return processedCountries.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesRegion = true;
      if (regionFilter === "EU Only") matchesRegion = c.isEU;
      else if (regionFilter !== "All") matchesRegion = c.region === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [processedCountries, searchQuery, regionFilter]);

  const availableList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'available'), [filteredForDrawer]);
  const soonList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'soon'), [filteredForDrawer]);
  const unavailableList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'unavailable'), [filteredForDrawer]);

  const activeTiles = useMemo(() => {
    const active = processedCountries.filter(c => selectedCountries.includes(c.name));
    return active.sort((a, b) => {
      const statusRank = { available: 1, soon: 2, unavailable: 3 };
      const rankA = statusRank[a.callStatus] || 4;
      const rankB = statusRank[b.callStatus] || 4;
      
      if (rankA !== rankB) {
        return rankA - rankB; 
      }
      
      if (a.callStatus === 'available') {
        return a.name.localeCompare(b.name); 
      } else {
        return a.waitMins - b.waitMins; 
      }
    });
  }, [processedCountries, selectedCountries]);

  const isAnyActiveCountryEU = useMemo(() => activeTiles.some(country => country.isEU), [activeTiles]);

  const callFlowSteps = useMemo(() => {
    const baseSteps = [
      "Greet", "Introduce", "Explain Purpose", "Call Monitoring & Right to Privacy Disclaimer",
      "E-Mail Confirmation", "Survey"
    ];
    if (isAnyActiveCountryEU) baseSteps.push("Closing Privacy Disclaimer");
    baseSteps.push("Thanks and Regards");
    return baseSteps;
  }, [isAnyActiveCountryEU]);

  const currentStepIndex = useMemo(() => {
    const index = callFlowSteps.findIndex(step => !completedSteps.includes(step));
    return index === -1 ? callFlowSteps.length : index; 
  }, [callFlowSteps, completedSteps]);

  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      setSelectedCountries(selectedCountries.filter(name => name !== countryName));
    } else {
      setSelectedCountries([...selectedCountries, countryName]);
    }
  };

  const toggleStep = (stepName) => {
    if (completedSteps.includes(stepName)) {
      setCompletedSteps(completedSteps.filter(s => s !== stepName));
    } else {
      setCompletedSteps([...completedSteps, stepName]);
    }
  };

  const toggleExpandStep = (stepName, e) => {
    e.stopPropagation(); 
    if (expandedSteps.includes(stepName)) {
      setExpandedSteps(expandedSteps.filter(s => s !== stepName));
    } else {
      setExpandedSteps([...expandedSteps, stepName]);
    }
  };

  const handleScriptEdit = (stepName, val) => {
    setCustomScripts(prev => ({ ...prev, [stepName]: val }));
  };

  const toggleConverter = (countryName) => {
    setConverterState(prev => ({
      ...prev, [countryName]: { ...prev[countryName], isOpen: !prev[countryName]?.isOpen }
    }));
  };

  const handleDateTimeChange = (countryName, field, value) => {
    setConverterState(prev => ({
      ...prev, [countryName]: { ...prev[countryName], [field]: value }
    }));
  };

  const applyDatePreset = (countryName, daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setConverterState(prev => ({
      ...prev, [countryName]: { ...prev[countryName], date: dateStr }
    }));
  };

  const handleSaveLog = (countryName, targetTimeDesc, associateTimeDesc) => {
    const newLog = {
      id: Date.now(), countryName, targetTimeDesc, associateTimeDesc, timestamp: new Date().toLocaleString()
    };
    setAppointmentLogs(prev => [newLog, ...prev]);
    alert("Appointment successfully saved to log!");
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to delete all saved logs? This cannot be undone.")) {
      setAppointmentLogs([]);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --bg-main: #F4F7F9;
          --bg-gradient: linear-gradient(135deg, #F4F7F9 0%, #E8EEF2 100%);
          --bg-drawer: #FFFFFF;
          --text-main: #0F172A;
          --text-muted: #64748B;
          --border: #E2E8F0;
          --shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.04);
          --shadow-card: 0 6px 16px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -4px rgba(15, 23, 42, 0.03);
          --shadow-hover: 0 16px 28px -8px rgba(15, 23, 42, 0.1), 0 8px 12px -6px rgba(15, 23, 42, 0.06);
          --color-good: #10B981;
          --grad-good: linear-gradient(135deg, #10B981 0%, #059669 100%);
          --bg-good: #ECFDF5;
          --color-soon: #F59E0B;
          --grad-soon: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
          --bg-soon: #FFFBEB;
          --color-bad: #94A3B8;
          --grad-bad: linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%);
          --bg-bad: #F8FAFC;
          --color-eu: #3B82F6;
        }

        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg-gradient); color: var(--text-main); -webkit-font-smoothing: antialiased; }
        .layout { display: flex; height: 100vh; overflow: hidden; position: relative; width: 100vw; }
        
        /* Drawer Styles */
        .drawer { width: 340px; min-width: 340px; background-color: var(--bg-drawer); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 10; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.03); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .drawer.open { transform: translateX(0); margin-left: 0; }
        .drawer.closed { transform: translateX(-100%); margin-left: -340px; }
        
        .drawer-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
        .drawer-title { margin: 0 0 16px 0; height: 42px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: var(--text-main); letter-spacing: -0.03em; text-align: center; }
        
        .location-dropdown { width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--text-main); background-color: #F1F5F9; border: 1px solid transparent; border-radius: 8px; margin-bottom: 10px; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 14px center; background-size: 14px; transition: all 0.2s; }
        .location-dropdown:hover { background-color: #E2E8F0; }
        .location-dropdown:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }

        .search-input { width: 100%; padding: 12px 14px; font-size: 13px; border-radius: 8px; border: 1px solid var(--border); box-sizing: border-box; outline: none; transition: all 0.2s; background-color: #F8FAFC; color: var(--text-main); margin-bottom: 10px; }
        .search-input:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }
        .search-input::placeholder { color: #94A3B8; }
        
        .drawer-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .drawer-settings { padding: 16px 20px; background: #F8FAFC; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 14px; }
        .settings-title { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin: 0; letter-spacing: 0.05em; text-align: center; }
        .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .settings-select { padding: 6px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px; font-weight: 600; color: var(--text-main); outline: none; cursor: pointer; flex: 1; text-align: center; }
        .settings-select:focus { border-color: var(--color-eu); }
        .settings-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }

        .list-section { margin-bottom: 24px; }
        .list-header { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 10px 0; letter-spacing: 0.08em; display: flex; align-items: center; }
        .list-header .count { margin-left: 4px; opacity: 0.7; font-weight: 600; }
        .list-item { padding: 10px 12px; margin: 0 -12px 4px -12px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; user-select: none; border: 1px solid transparent; }
        .list-item:hover { background-color: #F1F5F9; transform: translateX(2px); }
        .list-item.selected { background-color: var(--bg-good); border-color: rgba(16, 185, 129, 0.25); transform: translateX(2px); }
        .list-item-left { display: flex; align-items: center; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; flex-shrink: 0; }
        .dot-good { background: var(--grad-good); box-shadow: 0 0 0 3px var(--bg-good); }
        .dot-soon { background: var(--grad-soon); box-shadow: 0 0 0 3px var(--bg-soon); }
        .dot-bad { background: var(--grad-bad); }
        .country-name { font-weight: 600; font-size: 13px; color: #334155; }
        .selected .country-name { color: #065F46; }
        .time-preview { font-size: 12px; color: var(--text-muted); font-weight: 600; font-variant-numeric: tabular-nums; }
        
        .burger-menu-btn { position: absolute; top: 20px; left: 20px; background: #FFFFFF; border: 1px solid var(--border); border-radius: 10px; width: 42px; height: 42px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); transition: all 0.2s ease; outline: none; z-index: 20; }
        .burger-menu-btn:hover { border-color: var(--color-eu); background: #F8FAFC; transform: translateY(-1px); }
        .burger-menu-btn span { display: block; width: 20px; height: 2px; background: #475569; border-radius: 2px; transition: all 0.2s; }
        .burger-menu-btn.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .burger-menu-btn.open span:nth-child(2) { opacity: 0; }
        .burger-menu-btn.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .right-burger-menu-btn { position: absolute; top: 20px; right: 20px; background: #FFFFFF; border: 1px solid var(--border); border-radius: 10px; width: 42px; height: 42px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); transition: all 0.2s ease; outline: none; z-index: 20; }
        .right-burger-menu-btn:hover { border-color: var(--color-eu); background: #F8FAFC; transform: translateY(-1px); }
        .right-burger-menu-btn span { display: block; width: 20px; height: 2px; background: #475569; border-radius: 2px; transition: all 0.2s; }
        .right-burger-menu-btn.open span:nth-child(1) { transform: translateY(6px) rotate(-45deg); }
        .right-burger-menu-btn.open span:nth-child(2) { opacity: 0; }
        .right-burger-menu-btn.open span:nth-child(3) { transform: translateY(-6px) rotate(45deg); }

        /* Workspace & Canvas */
        .canvas { flex: 1; padding: 20px 24px; overflow-y: auto; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
        .canvas-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; animation: fadeIn 0.5s ease-in-out; }
        .canvas-empty h2 { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; letter-spacing: -0.03em; }
        .canvas-empty p { font-size: 14px; max-width: 380px; line-height: 1.6; color: #64748B; margin: 0; }
        
        .workspace-header { height: 42px; display: flex; justify-content: center; align-items: center; width: 100%; max-width: 1140px; margin: 0 auto 24px auto; }
        .workspace-title { font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; text-align: center; }

        /* List View Container & Rows */
        .list-view-container { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 1140px; margin: 0 auto; box-sizing: border-box; flex: 1; }
        .list-row-wrapper { display: flex; flex-direction: column; background: #FFF; border-radius: 12px; box-shadow: var(--shadow-card); border: 1px solid rgba(255,255,255,0.8); transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; position: relative; width: 100%; box-sizing: border-box; animation: slideUp 0.3s ease-out; }
        .list-row-wrapper:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
        .list-row-wrapper::before { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 5px; }
        .list-row-wrapper.list-good::before { background: var(--grad-good); }
        .list-row-wrapper.list-soon::before { background: var(--grad-soon); }
        .list-row-wrapper.list-bad::before { background: var(--grad-bad); }
        
        .list-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 14px 24px; gap: 16px; }
        
        .list-group { display: flex; align-items: center; gap: 12px; }
        .list-group-main { flex: 1.2; min-width: 180px; justify-content: flex-start; }
        .list-group-time { flex: 1.2; min-width: 180px; justify-content: flex-start; }
        .list-group-actions { flex: 1.5; display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
        
        .list-name { font-weight: 800; color: var(--text-main); font-size: 16px; margin: 0; letter-spacing: -0.02em; }
        .list-time { font-weight: 900; color: var(--text-main); font-size: 17px; margin: 0; font-variant-numeric: tabular-nums; }
        .list-offset { font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 0; }
        
        .btn-remove-icon { background: none; border: none; font-size: 22px; font-weight: bold; color: #94A3B8; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; padding: 0; margin-left: 4px; }
        .btn-remove-icon:hover { color: #EF4444; background: #FEF2F2; }

        .list-converter-wrap { padding: 0 20px 20px 24px; border-top: 1px solid var(--border); margin-top: -4px; background: #FFF; }
        
        /* Badges & Shared Elements */
        .badge { border-radius: 100px; font-weight: 700; letter-spacing: 0.03em; display: inline-flex; align-items: center; font-size: 11px; padding: 4px 10px; }
        .badge-eu { background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); }
        .badge-good { background-color: var(--bg-good); color: #047857; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-soon { background-color: var(--bg-soon); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-bad { background-color: var(--bg-bad); color: #475569; border: 1px solid rgba(148, 163, 184, 0.2); }
        
        .btn-toggle-converter { background-color: #F8FAFC; color: #475569; border: 1px solid var(--border); border-radius: 100px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; font-size: 12px; padding: 6px 12px; }
        .btn-toggle-converter:hover { background-color: #E2E8F0; color: #0F172A; }
        
        /* Converter Panel UI */
        .converter-panel { margin-top: 12px; padding: 16px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid var(--border); animation: fadeIn 0.3s ease; box-sizing: border-box; }
        .converter-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .converter-panel-header label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; text-align: center; flex: 1; }
        .btn-close { background: none; border: none; font-size: 18px; color: #94A3B8; cursor: pointer; line-height: 1; padding: 0; transition: color 0.2s; }
        .btn-close:hover { color: #0F172A; }

        .preset-container { display: flex; gap: 6px; margin-bottom: 10px; justify-content: center; }
        .preset-btn { background-color: #FFF; border: 1px solid var(--border); border-radius: 6px; font-weight: 600; color: var(--color-eu); cursor: pointer; transition: all 0.2s; font-size: 12px; padding: 6px 12px; }
        .preset-btn:hover { background-color: #EFF6FF; border-color: rgba(59, 130, 246, 0.3); }

        .datetime-column { display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 16px; margin-bottom: 10px; }
        .ghost-date-wrapper { position: relative; width: 100%; max-width: 160px; margin: 0; display: inline-block; }
        .ghost-date-display { background: #FFF; border: 1px solid var(--border); border-radius: 8px; font-weight: 600; color: var(--text-main); text-align: center; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); font-size: 13px; padding: 8px 12px; }
        .ghost-date-wrapper:hover .ghost-date-display { border-color: var(--color-eu); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .ghost-date-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; box-sizing: border-box; }
        .ghost-date-input::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; cursor: pointer; }
        
        .time-picker-container { display: flex; gap: 4px; justify-content: center; box-sizing: border-box; align-items: center; }
        .time-select { border-radius: 8px; border: 1px solid var(--border); font-family: inherit; font-weight: 500; outline: none; transition: all 0.2s; background-color: #FFF; color: var(--text-main); cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 8px center; background-size: 10px; font-size: 13px; padding: 8px; padding-right: 24px; }
        .time-select:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        
        .ampm-toggle { display: flex; background: #F1F5F9; border-radius: 6px; padding: 2px; gap: 2px; }
        .ampm-btn { border: none; background: transparent; font-weight: 700; color: #64748B; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-size: 12px; padding: 6px 10px; }
        .ampm-btn.active { background: #FFF; color: var(--color-eu); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        .converter-result { font-weight: 600; color: var(--text-muted); background: #FFF; border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-sm); border-left: 3px solid var(--color-eu); line-height: 1.4; font-size: 13px; padding: 12px; }
        .converter-result span { color: var(--text-main); font-weight: 800; display: block; margin-top: 4px; letter-spacing: -0.02em; font-size: 15px; }
        
        .dst-warning { color: #B45309; background: #FFFBEB; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600; display: flex; align-items: flex-start; gap: 6px; line-height: 1.3; animation: fadeIn 0.3s ease; font-size: 12px; padding: 10px; margin-top: 8px; }
        
        .date-alert-badge { display: inline-block; font-weight: 800; border-radius: 4px; margin-top: 4px; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 0.03em; font-size: 11px; padding: 4px 8px; }
        .badge-alert-weekend { background-color: #FEF2F2; color: #EF4444; border-color: rgba(239, 68, 68, 0.15); }
        .badge-alert-past { background-color: #F1F5F9; color: #475569; border-color: rgba(71, 85, 105, 0.15); }

        .btn-view-logs { background-color: #FFFFFF; border: 1px solid var(--border); padding: 12px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: var(--shadow-sm); transition: all 0.2s; width: 100%; margin-top: 4px; box-sizing: border-box; }
        .btn-view-logs:hover { border-color: var(--color-eu); background-color: #EFF6FF; color: var(--color-eu); }
        
        .btn-save-log { width: 100%; border-radius: 8px; font-weight: 700; background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); cursor: pointer; transition: all 0.2s; font-size: 13px; padding: 10px; margin-top: 12px; }
        .btn-save-log:hover { background-color: var(--color-eu); color: #FFF; }
        .btn-clear-logs-action { background: none; border: none; font-size: 12px; font-weight: 700; color: #EF4444; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: background 0.2s; }
        .btn-clear-logs-action:hover { background: #FEF2F2; }

        /* Right Drawer Styles - RESIZABLE */
        .flow-sidebar { width: min(var(--right-drawer-width, 340px), 100vw); flex-shrink: 0; background-color: var(--bg-drawer); border-left: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 16px 56px 16px; box-sizing: border-box; box-shadow: -4px 0 24px rgba(15, 23, 42, 0.02); height: 100vh; z-index: 10; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        .flow-sidebar.open { transform: translateX(0); margin-right: 0; }
        .flow-sidebar.closed { transform: translateX(100%); margin-right: calc(-1 * min(var(--right-drawer-width, 340px), 100vw)); }
        
        /* Drawer Resizer Handle */
        .drawer-resizer { position: absolute; left: -2px; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 50; background: transparent; transition: background 0.2s; }
        .drawer-resizer:hover, .drawer-resizer.active { background: var(--color-eu); }

        .flow-title { margin: 0 0 16px 0; width: calc(100% - 50px); box-sizing: border-box; font-size: 16px; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; padding: 0 16px; height: 42px; background: #F8FAFC; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; user-select: none; }
        .flow-title:hover { background: #F1F5F9; border-color: #CBD5E1; }
        .flow-title .caret { font-size: 12px; color: #94A3B8; transition: transform 0.3s ease; }
        .flow-title .caret.open { transform: rotate(180deg); }
        
        .flow-scroll { flex: 1; max-height: none; overflow-y: auto; display: flex; flex-direction: column; padding-right: 4px; margin-bottom: 0; animation: fadeIn 0.3s ease; }
        
        /* REMOVED SCALING ON ACTIVE CARDS TO FIX BORDER CLIPPING */
        .flow-item { display: flex; flex-direction: column; padding: 12px; background: #F8FAFC; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; margin-bottom: 8px; }
        .flow-item.future { background: #F8FAFC; opacity: 0.8; }
        .flow-item.future:hover { background: #F1F5F9; border-color: #CBD5E1; }
        .flow-item.current { background: #FFFFFF; padding: 16px 14px; margin: 12px 0; border: 2px solid var(--color-eu); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.12); opacity: 1; z-index: 2; position: relative; }
        .flow-item.done { background: #F0FDF4; border-color: #BBF7D0; opacity: 0.5; padding: 8px 12px; margin: 4px 0; }
        .flow-item.done:hover { opacity: 0.8; }
        
        .flow-row-top { display: flex; align-items: flex-start; gap: 10px; width: 100%; position: relative; }
        .flow-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #94A3B8; display: flex; align-items: center; justify-content: center; margin-top: 1px; flex-shrink: 0; background: #FFF; transition: all 0.3s ease; }
        .flow-item.current .flow-checkbox { border-color: var(--color-eu); border-width: 2px; }
        .flow-item.done .flow-checkbox { background: var(--color-good); border-color: var(--color-good); }
        .flow-checkbox::after { content: '✓'; color: #FFF; font-size: 11px; font-weight: 900; display: none; }
        .flow-item.done .flow-checkbox::after { display: block; }
        
        .flow-text-container { display: flex; flex-direction: column; gap: 2px; flex: 1; padding-right: 24px; transition: all 0.3s ease; }
        .flow-num { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; transition: all 0.3s ease; }
        .flow-item.current .flow-num { color: var(--color-eu); font-size: 11px; }
        .flow-item.done .flow-num { color: #15803D; opacity: 0.7; }
        .flow-name { font-size: 13px; font-weight: 600; color: #334155; line-height: 1.4; transition: all 0.3s ease; }
        .flow-item.current .flow-name { font-size: 15px; font-weight: 800; color: #0F172A; }
        .flow-item.done .flow-name { color: #166534; text-decoration: line-through; opacity: 0.7; font-size: 12px; }
        
        .flow-expand-trigger { position: absolute; right: 0; top: 2px; background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px; font-weight: bold; transition: transform 0.2s, color 0.2s; border-radius: 4px; }
        .flow-expand-trigger:hover { color: var(--color-eu); background: #E2E8F0; }
        .flow-expand-trigger.rotated { transform: rotate(180deg); }

        .flow-script-panel { margin-top: 10px; padding: 10px; background: #FFFFFF; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; animation: fadeIn 0.2s ease; width: 100%; box-sizing: border-box; cursor: default; }
        .flow-textarea { width: 100%; height: 75px; border: 1px solid var(--border); border-radius: 6px; font-family: inherit; font-size: 12px; color: var(--text-main); padding: 8px; box-sizing: border-box; resize: none; background: #F8FAFC; outline: none; transition: border-color 0.2s; }
        .flow-textarea:focus { border-color: var(--color-eu); background: #FFF; }
        .flow-script-actions { display: flex; justify-content: flex-end; width: 100%; }
        .btn-save-script { padding: 4px 10px; font-size: 11px; font-weight: 700; background: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .btn-save-script:hover { background: var(--color-eu); color: #FFF; }
        .btn-reset-flow { width: 100%; padding: 10px; background: #FFF; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 6px; }
        .btn-reset-flow:hover { background: #F1F5F9; color: var(--text-main); border-color: #CBD5E1; }

        /* Workspace Notes BOTTOM DRAWER */
        .scratchpad-container { position: absolute; bottom: 0; left: 0; width: 100%; background: #FFFFFF; border-top: 1px solid var(--border); display: flex; flex-direction: column; transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 20; box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.05); }
        .scratchpad-container.open { height: 50%; }
        .scratchpad-container.closed { height: 56px; overflow: hidden; }
        .scratchpad-header { height: 56px; min-height: 56px; margin: 0; padding: 0 20px; font-size: 15px; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: #F8FAFC; transition: background 0.2s; user-select: none; border-bottom: 1px solid var(--border); }
        .scratchpad-header:hover { background: #F1F5F9; }
        .scratchpad-header .caret { font-size: 12px; color: #94A3B8; transition: transform 0.3s ease; }
        .scratchpad-header .caret.open { transform: rotate(180deg); }
        
        .scratchpad-body { flex: 1; padding: 16px; display: flex; flex-direction: column; overflow: hidden; background: #FFF; }
        .scratchpad-textarea { flex: 1; width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-family: inherit; font-size: 13px; color: var(--text-main); resize: none; outline: none; background: #F8FAFC; box-sizing: border-box; box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.02); transition: all 0.2s ease; line-height: 1.5; }
        .scratchpad-textarea:focus { border-color: var(--color-eu); background: #FFF; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .scratchpad-textarea::placeholder { color: #94A3B8; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.4); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
        .modal-content { background: #FFF; width: 90%; max-width: 500px; max-height: 80vh; border-radius: 20px; box-shadow: var(--shadow-hover); display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s ease; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); }
        .modal-body { padding: 24px; overflow-y: auto; flex: 1; background: #F8FAFC; }
        .log-card { background: #FFF; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm); }
        .log-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
        .log-timestamp { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .log-delete-btn { background: none; border: none; font-size: 12px; font-weight: 700; color: #EF4444; cursor: pointer; padding: 0; opacity: 0.7; transition: opacity 0.2s; }
        .log-delete-btn:hover { opacity: 1; }
        .log-details { font-size: 14px; line-height: 1.6; color: var(--text-main); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="layout">
        <LeftDrawer 
          isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen}
          associateLocation={associateLocation} setAssociateLocation={setAssociateLocation}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          regionFilter={regionFilter} setRegionFilter={setRegionFilter}
          callWindowStart={callWindowStart} setCallWindowStart={setCallWindowStart}
          callWindowEnd={callWindowEnd} setCallWindowEnd={setCallWindowEnd}
          availableList={availableList} soonList={soonList} unavailableList={unavailableList}
          selectedCountries={selectedCountries} toggleCountry={toggleCountry}
          appointmentLogs={appointmentLogs} setIsLogModalOpen={setIsLogModalOpen}
        />

        <ActiveWorkspace 
          canvasRef={canvasRef}
          selectedCountries={selectedCountries}
          activeTiles={activeTiles}
          converterState={converterState}
          toggleConverter={toggleConverter}
          applyDatePreset={applyDatePreset}
          handleDateTimeChange={handleDateTimeChange}
          handleSaveLog={handleSaveLog}
          associateLocation={associateLocation}
          officeLabels={officeLabels}
          officeTimezones={officeTimezones}
          toggleCountry={toggleCountry}
          isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen}
          isRightDrawerOpen={isRightDrawerOpen} setIsRightDrawerOpen={setIsRightDrawerOpen}
        />

        <RightDrawer 
          isRightDrawerOpen={isRightDrawerOpen}
          isFlowGuideExpanded={isFlowGuideExpanded} setIsFlowGuideExpanded={setIsFlowGuideExpanded}
          callFlowSteps={callFlowSteps}
          completedSteps={completedSteps} setCompletedSteps={setCompletedSteps}
          currentStepIndex={currentStepIndex}
          expandedSteps={expandedSteps}
          toggleStep={toggleStep} toggleExpandStep={toggleExpandStep}
          customScripts={customScripts} handleScriptEdit={handleScriptEdit}
          userNotes={userNotes} setUserNotes={setUserNotes}
        />

        {isLogModalOpen && (
          <div className="modal-overlay" onClick={() => setIsLogModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2>Appointment Logs</h2>
                  {appointmentLogs.length > 0 && (
                    <button className="btn-clear-logs-action" onClick={handleClearLogs}>
                      Clear All Logs
                    </button>
                  )}
                </div>
                <button className="btn-close" onClick={() => setIsLogModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {appointmentLogs.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)'}}>
                    <h3 style={{margin: '0 0 8px 0', color: 'var(--text-main)'}}>No Logs Yet</h3>
                    <p style={{margin: 0, fontSize: '14px'}}>Use the time converter to save upcoming appointments.</p>
                  </div>
                ) : (
                  appointmentLogs.map(log => (
                    <div key={log.id} className="log-card">
                      <div className="log-card-header">
                        <span className="log-timestamp">Saved: {log.timestamp}</span>
                        <button className="log-delete-btn" onClick={() => setAppointmentLogs(prev => prev.filter(l => l.id !== log.id))}>Delete</button>
                      </div>
                      <div className="log-details">
                        <strong>Target ({log.countryName}):</strong> {log.targetTimeDesc} <br />
                        <strong style={{display: 'inline-block', marginTop: '6px'}}>Associate Time:</strong> <span style={{color: 'var(--color-eu)', fontWeight: 'bold'}}>{log.associateTimeDesc}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
