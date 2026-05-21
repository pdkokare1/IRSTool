// App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { countries } from './countryData';

// Helper to reliably find a timezone's UTC offset (in minutes) at any specific date/time
const getTzOffsetMins = (dateObj, timeZone) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    const parts = fmt.formatToParts(dateObj);
    const p = {};
    parts.forEach(part => p[part.type] = part.value);
    
    // Handle 24:00 edge case from some browser implementations
    const hr = p.hour === '24' ? '00' : p.hour;
    const isoString = `${p.year}-${p.month.padStart(2, '0')}-${p.day.padStart(2, '0')}T${hr.padStart(2, '0')}:${p.minute.padStart(2, '0')}:${p.second.padStart(2, '0')}Z`;
    
    const tzDate = new Date(isoString);
    return Math.round((tzDate - dateObj) / 60000);
  } catch (e) {
    return 0; // Fallback
  }
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All"); 
  const [ticker, setTicker] = useState(Date.now());
  
  // State to manage the drawer visibility status
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  
  const [associateLocation, setAssociateLocation] = useState(() => {
    return localStorage.getItem('associateLoc_v2') || 'IN';
  });
  
  const [selectedCountries, setSelectedCountries] = useState(() => {
    const saved = localStorage.getItem('selectedCountries');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointmentLogs, setAppointmentLogs] = useState(() => {
    const saved = localStorage.getItem('appointmentLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [callWindowStart, setCallWindowStart] = useState(() => {
    return parseInt(localStorage.getItem('callWindowStart')) || 9;
  });
  const [callWindowEnd, setCallWindowEnd] = useState(() => {
    return parseInt(localStorage.getItem('callWindowEnd')) || 17;
  });

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
      let callStatus = 'unavailable';
      let offsetText = "Unknown offset";
      let diffMins = 0;

      try {
        const options = { timeZone: country.timezone, hour: 'numeric', minute: 'numeric', hour12: true };
        localTimeString = new Intl.DateTimeFormat('en-US', options).format(now);

        const hourOptions = { timeZone: country.timezone, hour: 'numeric', hour12: false };
        localHour = parseInt(new Intl.DateTimeFormat('en-US', hourOptions).format(now), 10);

        if (localHour >= callWindowStart && localHour < callWindowEnd) {
          callStatus = 'available';
        } else if (localHour >= (callWindowStart - 2) && localHour < callWindowStart) {
          callStatus = 'soon';
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

      return { ...country, localTimeString, callStatus, offsetText, diffMins };
    });
  }, [ticker, associateLocation, callWindowStart, callWindowEnd]);

  const filteredForDrawer = useMemo(() => {
    return processedCountries.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesRegion = true;
      if (regionFilter === "EU Only") {
        matchesRegion = c.isEU;
      } else if (regionFilter !== "All") {
        matchesRegion = c.region === regionFilter;
      }

      return matchesSearch && matchesRegion;
    });
  }, [processedCountries, searchQuery, regionFilter]);

  const availableList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'available'), [filteredForDrawer]);
  const soonList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'soon'), [filteredForDrawer]);
  const unavailableList = useMemo(() => filteredForDrawer.filter(c => c.callStatus === 'unavailable'), [filteredForDrawer]);

  const activeTiles = useMemo(() => {
    return processedCountries.filter(c => selectedCountries.includes(c.name));
  }, [processedCountries, selectedCountries]);

  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      setSelectedCountries(selectedCountries.filter(name => name !== countryName));
    } else {
      setSelectedCountries([...selectedCountries, countryName]);
    }
  };

  const toggleConverter = (countryName) => {
    setConverterState(prev => ({
      ...prev,
      [countryName]: {
        ...prev[countryName],
        isOpen: !prev[countryName]?.isOpen
      }
    }));
  };

  const handleDateTimeChange = (countryName, field, value) => {
    setConverterState(prev => ({
      ...prev,
      [countryName]: {
        ...prev[countryName],
        [field]: value
      }
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
      ...prev,
      [countryName]: {
        ...prev[countryName],
        date: dateStr
      }
    }));
  };

  const handleSaveLog = (countryName, targetTimeDesc, associateTimeDesc) => {
    const newLog = {
      id: Date.now(),
      countryName,
      targetTimeDesc,
      associateTimeDesc,
      timestamp: new Date().toLocaleString()
    };
    setAppointmentLogs(prev => [newLog, ...prev]);
    alert("Appointment successfully saved to log!");
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to delete all saved logs? This cannot be undone.")) {
      setAppointmentLogs([]);
    }
  };

  const DrawerList = ({ title, items, dotClass }) => {
    if (items.length === 0) return null;
    return (
      <div className="list-section">
        <h3 className="list-header">{title} <span className="count">({items.length})</span></h3>
        {items.map(country => {
          const isSelected = selectedCountries.includes(country.name);
          return (
            <div 
              key={country.name} 
              onClick={() => toggleCountry(country.name)}
              className={`list-item ${isSelected ? 'selected' : ''}`}
            >
              <div className="list-item-left">
                <span className={`status-dot ${dotClass}`}></span>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span className="country-name">{country.name}</span>
                  <span className="time-offset-small" style={{fontSize: '11px', color: '#94A3B8', marginTop: '2px'}}>{country.offsetText}</span>
                </div>
              </div>
              <span className="time-preview">{country.localTimeString}</span>
            </div>
          );
        })}
      </div>
    );
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
        
        .drawer { width: 340px; min-width: 340px; background-color: var(--bg-drawer); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 10; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.03); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .drawer.open { transform: translateX(0); margin-left: 0; }
        .drawer.closed { transform: translateX(-100%); margin-left: -340px; }

        .drawer-header { padding: 24px 20px 16px; border-bottom: 1px solid var(--border); }
        .drawer-title { margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: var(--text-main); letter-spacing: -0.03em; }
        
        .location-dropdown { width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--text-main); background-color: #F1F5F9; border: 1px solid transparent; border-radius: 8px; margin-bottom: 10px; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 14px center; background-size: 14px; transition: all 0.2s; }
        .location-dropdown:hover { background-color: #E2E8F0; }
        .location-dropdown:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }

        .search-input { width: 100%; padding: 12px 14px; font-size: 13px; border-radius: 8px; border: 1px solid var(--border); box-sizing: border-box; outline: none; transition: all 0.2s; background-color: #F8FAFC; color: var(--text-main); margin-bottom: 10px; }
        .search-input:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }
        .search-input::placeholder { color: #94A3B8; }
        
        .drawer-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; }
        
        .drawer-settings { padding: 16px 20px; background: #F8FAFC; border-top: 1px solid var(--border); }
        .settings-title { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin: 0 0 10px 0; letter-spacing: 0.05em; }
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
        
        .canvas-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; min-height: 42px; position: relative; z-index: 6; }
        
        .burger-menu-btn { background: #FFFFFF; border: 1px solid var(--border); border-radius: 10px; width: 42px; height: 42px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); transition: all 0.2s ease; outline: none; }
        .burger-menu-btn:hover { border-color: var(--color-eu); background: #F8FAFC; transform: translateY(-1px); }
        .burger-menu-btn span { display: block; width: 20px; height: 2px; background: #475569; border-radius: 2px; transition: all 0.2s; }
        .burger-menu-btn.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .burger-menu-btn.open span:nth-child(2) { opacity: 0; }
        .burger-menu-btn.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .canvas { flex: 1; padding: 32px 40px; overflow-y: auto; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; }
        .canvas-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; animation: fadeIn 0.5s ease-in-out; }
        .canvas-empty h2 { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; letter-spacing: -0.03em; }
        .canvas-empty p { font-size: 14px; max-width: 380px; line-height: 1.6; color: #64748B; margin: 0; }
        
        .grid { display: grid; gap: 16px; align-content: start; flex: 1; min-height: 0; width: 100%; box-sizing: border-box; }
        
        /* Capped sizes for low volumes prevents stretching across the screen */
        .grid[data-count="1"] { grid-template-columns: repeat(auto-fit, minmax(300px, 420px)); max-height: 500px; }
        .grid[data-count="2"] { grid-template-columns: repeat(auto-fit, minmax(300px, 420px)); max-height: 500px; }
        .grid[data-count="3"] { grid-template-columns: repeat(3, 1fr); max-height: 500px; }
        .grid[data-count="4"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); height: calc(100vh - 140px); }
        .grid[data-count="5"], .grid[data-count="6"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); height: calc(100vh - 140px); }
        .grid[data-count="7"], .grid[data-count="8"] { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); height: calc(100vh - 140px); }
        .grid[data-count="9"], .grid[data-count="10"], .grid[data-count="11"], .grid[data-count="12"] { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); height: calc(100vh - 140px); }
        
        .card { background-color: #FFF; padding: 18px 20px; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-card); border: 1px solid rgba(255,255,255,0.8); transition: all 0.2s ease-in-out; position: relative; animation: slideUp 0.3s ease-out; min-height: 0; box-sizing: border-box; overflow: hidden; }
        .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
        .card-good::before { background: var(--grad-good); }
        .card-soon::before { background: var(--grad-soon); }
        .card-bad::before { background: var(--grad-bad); }
        
        .grid[data-count="1"] .card-country, .grid[data-count="2"] .card-country, .grid[data-count="3"] .card-country { font-size: 20px; }
        .grid[data-count="1"] .card-time, .grid[data-count="2"] .card-time, .grid[data-count="3"] .card-time { font-size: 26px; }
        
        .grid[data-count*="4"] .card-country, .grid[data-count*="5"] .card-country, .grid[data-count*="6"] .card-country, .grid[data-count*="7"] .card-country, .grid[data-count*="8"] .card-country, .grid[data-count*="9"] .card-country, .grid[data-count*="10"] .card-country, .grid[data-count*="11"] .card-country, .grid[data-count*="12"] .card-country { font-size: 16px; }
        .grid[data-count*="4"] .card-time, .grid[data-count*="5"] .card-time, .grid[data-count*="6"] .card-time, .grid[data-count*="7"] .card-time, .grid[data-count*="8"] .card-time, .grid[data-count*="9"] .card-time, .grid[data-count*="10"] .card-time, .grid[data-count*="11"] .card-time, .grid[data-count*="12"] .card-time { font-size: 20px; }
        .grid[data-count*="4"] .card-offset, .grid[data-count*="5"] .card-offset, .grid[data-count*="6"] .card-offset, .grid[data-count*="7"] .card-offset, .grid[data-count*="8"] .card-offset, .grid[data-count*="9"] .card-offset, .grid[data-count*="10"] .card-offset, .grid[data-count*="11"] .card-offset, .grid[data-count*="12"] .card-offset { font-size: 11px; }
        .grid[data-count*="4"] .badge, .grid[data-count*="5"] .badge, .grid[data-count*="6"] .badge, .grid[data-count*="7"] .badge, .grid[data-count*="8"] .badge, .grid[data-count*="9"] .badge, .grid[data-count*="10"] .badge, .grid[data-count*="11"] .badge, .grid[data-count*="12"] .badge { font-size: 10px; padding: 4px 8px; }
        .grid[data-count*="4"] .btn-toggle-converter, .grid[data-count*="5"] .btn-toggle-converter, .grid[data-count*="6"] .btn-toggle-converter, .grid[data-count*="7"] .btn-toggle-converter, .grid[data-count*="8"] .btn-toggle-converter, .grid[data-count*="9"] .btn-toggle-converter, .grid[data-count*="10"] .btn-toggle-converter, .grid[data-count*="11"] .btn-toggle-converter, .grid[data-count*="12"] .btn-toggle-converter { font-size: 11px; padding: 5px 10px; }
        .grid[data-count*="4"] .btn-remove, .grid[data-count*="5"] .btn-remove, .grid[data-count*="6"] .btn-remove, .grid[data-count*="7"] .btn-remove, .grid[data-count*="8"] .btn-remove, .grid[data-count*="9"] .btn-remove, .grid[data-count*="10"] .btn-remove, .grid[data-count*="11"] .btn-remove, .grid[data-count*="12"] .btn-remove { font-size: 11px; padding: 8px; }

        .card-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .card-country { font-weight: 800; margin: 0; color: var(--text-main); letter-spacing: -0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-time { font-weight: 900; margin: 0; color: var(--text-main); font-variant-numeric: tabular-nums; letter-spacing: -0.04em; line-height: 1; }
        
        .card-sub-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; min-height: 18px; }
        .card-offset { font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 0; opacity: 0.9; text-align: right; }
        
        .card-actions-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-top: 10px; border-top: 1px solid var(--border); }
        
        .badge { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; display: inline-flex; align-items: center; }
        .badge-eu { background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); }
        .badge-good { background-color: var(--bg-good); color: #047857; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-soon { background-color: var(--bg-soon); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-bad { background-color: var(--bg-bad); color: #475569; border: 1px solid rgba(148, 163, 184, 0.2); }
        
        .btn-toggle-converter { background-color: #F8FAFC; color: #475569; border: 1px solid var(--border); padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; }
        .btn-toggle-converter:hover { background-color: #E2E8F0; color: #0F172A; }
        
        .converter-panel { margin-bottom: 12px; padding: 12px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid var(--border); animation: fadeIn 0.3s ease; overflow-y: auto; max-height: 180px; box-sizing: border-box; }
        .converter-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .converter-panel-header label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .btn-close { background: none; border: none; font-size: 16px; color: #94A3B8; cursor: pointer; line-height: 1; padding: 0; transition: color 0.2s; }
        .btn-close:hover { color: #0F172A; }

        .preset-container { display: flex; gap: 6px; margin-bottom: 10px; justify-content: center; }
        .preset-btn { background-color: #FFF; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: var(--color-eu); cursor: pointer; transition: all 0.2s; }
        .preset-btn:hover { background-color: #EFF6FF; border-color: rgba(59, 130, 246, 0.3); }

        .datetime-column { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 10px; }
        
        .ghost-date-wrapper { position: relative; width: 100%; max-width: 150px; margin: 0 auto; display: inline-block; }
        .ghost-date-display { padding: 6px 10px; background: #FFF; border: 1px solid var(--border); border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--text-main); text-align: center; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .ghost-date-wrapper:hover .ghost-date-display { border-color: var(--color-eu); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        
        .ghost-date-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; box-sizing: border-box; }
        .ghost-date-input::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; cursor: pointer; }
        
        .time-picker-container { display: flex; gap: 4px; justify-content: center; box-sizing: border-box; align-items: center; }
        .time-select { padding: 6px; border-radius: 8px; border: 1px solid var(--border); font-family: inherit; font-size: 12px; font-weight: 500; outline: none; transition: all 0.2s; background-color: #FFF; color: var(--text-main); cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 6px center; background-size: 10px; padding-right: 18px; }
        .time-select:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .ampm-toggle { display: flex; background: #F1F5F9; border-radius: 6px; padding: 2px; gap: 2px; }
        .ampm-btn { border: none; background: transparent; padding: 4px 6px; font-size: 11px; font-weight: 700; color: #64748B; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .ampm-btn.active { background: #FFF; color: var(--color-eu); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        .converter-result { font-size: 11px; font-weight: 600; color: var(--text-muted); background: #FFF; padding: 10px; border-radius: 8px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-left: 3px solid var(--color-eu); line-height: 1.4; }
        .converter-result span { color: var(--text-main); font-weight: 800; display: block; margin-top: 4px; font-size: 14px; letter-spacing: -0.02em; }
        
        .dst-warning { font-size: 11px; color: #B45309; background: #FFFBEB; padding: 8px 10px; border-radius: 6px; margin-top: 8px; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600; display: flex; align-items: flex-start; gap: 6px; line-height: 1.3; animation: fadeIn 0.3s ease; }
        .date-alert-badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 800; border-radius: 4px; margin-top: 4px; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 0.03em; }
        .badge-alert-weekend { background-color: #FEF2F2; color: #EF4444; border-color: rgba(239, 68, 68, 0.15); }
        .badge-alert-past { background-color: #F1F5F9; color: #475569; border-color: rgba(71, 85, 105, 0.15); }
        
        .btn-remove { width: 100%; padding: 10px; background-color: #FFF; border: 1px solid var(--border); border-radius: 10px; color: var(--text-muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; margin-top: auto; }
        .btn-remove:hover { background-color: #FEF2F2; color: #EF4444; border-color: #FECACA; }

        .btn-view-logs { background-color: #FFF; border: 1px solid var(--border); padding: 10px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm); transition: all 0.2s; }
        .btn-view-logs:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); border-color: var(--color-eu); }
        .btn-save-log { margin-top: 8px; width: 100%; padding: 8px; border-radius: 8px; font-size: 11px; font-weight: 700; background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); cursor: pointer; transition: all 0.2s; }
        .btn-save-log:hover { background-color: var(--color-eu); color: #FFF; }
        .btn-clear-logs-action { background: none; border: none; font-size: 12px; font-weight: 700; color: #EF4444; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: background 0.2s; }
        .btn-clear-logs-action:hover { background: #FEF2F2; }

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
        <div className={`drawer ${isDrawerOpen ? 'open' : 'closed'}`}>
          <div className="drawer-header">
            <h2 className="drawer-title">Global Directory</h2>
            
            <select 
              className="location-dropdown"
              value={associateLocation}
              onChange={(e) => setAssociateLocation(e.target.value)}
            >
              <option value="IN">🇮🇳 India</option>
              <option value="US">🇺🇸 United States (EST)</option>
              <option value="UK">🇬🇧 United Kingdom</option>
            </select>

            <input 
              type="text" 
              placeholder="Search countries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            
            <select 
              className="location-dropdown"
              style={{ marginTop: '0', backgroundColor: '#FFF', border: '1px solid var(--border)' }}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">🌍 All Regions</option>
              <option value="EU Only">🇪🇺 European Union (GDPR)</option>
              <option value="Europe">Europe (Non-EU & EU)</option>
              <option value="North America">North America</option>
              <option value="South America">South America</option>
              <option value="Asia">Asia</option>
              <option value="Southeast Asia">Southeast Asia</option>
              <option value="Middle East">Middle East & Gulf</option>
              <option value="Africa">Africa</option>
              <option value="Oceania">Oceania & Pacific</option>
            </select>
          </div>
          
          <div className="drawer-scroll">
            <DrawerList title="Good to Call" items={availableList} dotClass="dot-good" />
            <DrawerList title="Soon Available" items={soonList} dotClass="dot-soon" />
            <DrawerList title="Outside Hours" items={unavailableList} dotClass="dot-bad" />
            
            {filteredForDrawer.length === 0 && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '14px', fontWeight: '500'}}>No matching countries found.</p>
            )}
          </div>

          <div className="drawer-settings">
            <h3 className="settings-title">Target Business Hours</h3>
            <div className="settings-row">
              <select 
                className="settings-select" 
                value={callWindowStart} 
                onChange={(e) => setCallWindowStart(parseInt(e.target.value))}
              >
                <option value={7}>07:00 AM</option>
                <option value={8}>08:00 AM</option>
                <option value={9}>09:00 AM</option>
                <option value={10}>10:00 AM</option>
              </select>
              <span className="settings-label">to</span>
              <select 
                className="settings-select" 
                value={callWindowEnd} 
                onChange={(e) => setCallWindowEnd(parseInt(e.target.value))}
              >
                <option value={15}>03:00 PM</option>
                <option value={16}>04:00 PM</option>
                <option value={17}>05:00 PM</option>
                <option value={18}>06:00 PM</option>
                <option value={19}>07:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        <div className="canvas">
          <div className="canvas-topbar">
            <button 
              className={`burger-menu-btn ${isDrawerOpen ? 'open' : ''}`}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title={isDrawerOpen ? "Hide Directory" : "Show Directory"}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <button className="btn-view-logs" onClick={() => setIsLogModalOpen(true)}>
              View Logs {appointmentLogs.length > 0 && `(${appointmentLogs.length})`}
            </button>
          </div>

          {selectedCountries.length === 0 ? (
            <div className="canvas-empty">
              <h2>Your Workspace is Empty</h2>
              <p>Select targets from the directory on the left to pin them to your active calling dashboard.</p>
            </div>
          ) : (
            <div className="grid" data-count={activeTiles.length}>
              {activeTiles.map((country) => {
                let cardClass = 'card-bad';
                let badgeClass = 'badge-bad';
                let statusText = "Outside Hours";

                if (country.callStatus === 'available') {
                  cardClass = 'card-good';
                  badgeClass = 'badge-good';
                  statusText = "Good to Call";
                } else if (country.callStatus === 'soon') {
                  cardClass = 'card-soon';
                  badgeClass = 'badge-soon';
                  statusText = "Soon Available";
                }

                const convState = converterState[country.name] || { isOpen: false, date: '', time: '' };
                let convertedAssociateTime = null;
                let hasDstWarning = false;
                let isWeekendTarget = false;
                let isPastTarget = false;
                
                const handleTimePartChange = (part, value) => {
                  const currentTime = convState.time || '09:00';
                  let [hours, minutes] = currentTime.split(':');
                  let isPM = parseInt(hours, 10) >= 12;
                  let hr12 = parseInt(hours, 10) % 12 || 12;

                  if (part === 'hour') hr12 = parseInt(value, 10);
                  if (part === 'minute') minutes = value;
                  if (part === 'ampm') isPM = value === 'PM';

                  let newHours24 = hr12 === 12 ? (isPM ? 12 : 0) : (isPM ? hr12 + 12 : hr12);
                  const newTime = `${String(newHours24).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                  handleDateTimeChange(country.name, 'time', newTime);
                };

                const currentT = convState.time || '09:00';
                const [h24, m] = currentT.split(':');
                const isPM = parseInt(h24, 10) >= 12;
                const h12 = parseInt(h24, 10) % 12 || 12;
                
                let targetDateStr = '';
                if (convState.date) {
                  const [y, mmTarget, d] = convState.date.split('-');
                  targetDateStr = `${d}/${mmTarget}/${y}`;
                  
                  try {
                    const selectedDateObj = new Date(convState.date + 'T00:00:00');
                    const dayOfWeek = selectedDateObj.getDay(); 
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                      isWeekendTarget = true;
                    }
                    
                    const todayNoon = new Date();
                    todayNoon.setHours(0,0,0,0);
                    if (selectedDateObj < todayNoon) {
                      isPastTarget = true;
                    }
                  } catch(e) {}
                }

                const targetFormattedTime = convState.time 
                  ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(`2000-01-01T${convState.time}`)) 
                  : '';

                if (convState.date && convState.time) {
                  try {
                    const guessUtc = new Date(`${convState.date}T${convState.time}Z`);
                    
                    const targetOffsetFuture = getTzOffsetMins(guessUtc, country.timezone);
                    let exactUtc = new Date(guessUtc.getTime() - targetOffsetFuture * 60000);
                    
                    const targetOffsetFinal = getTzOffsetMins(exactUtc, country.timezone);
                    exactUtc = new Date(guessUtc.getTime() - targetOffsetFinal * 60000);

                    const currentAssociateTz = officeTimezones[associateLocation];
                    const associateOffsetFuture = getTzOffsetMins(exactUtc, currentAssociateTz);
                    
                    const futureDiffMins = targetOffsetFinal - associateOffsetFuture;
                    if (futureDiffMins !== country.diffMins) {
                      hasDstWarning = true;
                    }

                    const parts = new Intl.DateTimeFormat('en-US', { 
                      timeZone: currentAssociateTz, year: 'numeric', month: 'numeric', day: 'numeric', 
                      hour: 'numeric', minute: 'numeric', hour12: true 
                    }).formatToParts(exactUtc);
                    
                    const ddAs = parts.find(p => p.type === 'day').value.padStart(2, '0');
                    const mmAs = parts.find(p => p.type === 'month').value.padStart(2, '0');
                    const yyyyAs = parts.find(p => p.type === 'year').value;
                    const hrAs = parts.find(p => p.type === 'hour').value;
                    const mnAs = parts.find(p => p.type === 'minute').value;
                    const apAs = parts.find(p => p.type === 'dayPeriod').value;

                    convertedAssociateTime = `${ddAs}/${mmAs}/${yyyyAs}, ${hrAs}:${mnAs} ${apAs}`;
                  } catch (e) {
                    console.error("Time Conversion Error:", e);
                  }
                }

                return (
                  <div key={country.name} className={`card ${cardClass}`}>
                    <div>
                      <div className="card-main-row">
                        <h2 className="card-country">{country.name}</h2>
                        <p className="card-time">{country.localTimeString}</p>
                      </div>
                      
                      <div className="card-sub-row">
                        <div style={{flex: 1}}>
                          {country.isEU && <span className="badge badge-eu">🇪🇺 GDPR</span>}
                        </div>
                        <span className="card-offset">{country.offsetText}</span>
                      </div>
                      
                      <div className="card-actions-row">
                        <span className={`badge ${badgeClass}`}>{statusText}</span>
                        <button 
                          onClick={() => toggleConverter(country.name)} 
                          className="btn-toggle-converter"
                        >
                          Convert Time
                        </button>
                      </div>

                      {convState.isOpen && (
                        <div className="converter-panel">
                          <div className="converter-panel-header">
                            <label>Respondent's Requested Time</label>
                            <button className="btn-close" onClick={() => toggleConverter(country.name)}>&times;</button>
                          </div>
                          
                          <div className="preset-container">
                            <button className="preset-btn" onClick={() => applyDatePreset(country.name, 1)}>Tomorrow</button>
                            <button className="preset-btn" onClick={() => applyDatePreset(country.name, 2)}>Day After</button>
                          </div>

                          <div className="datetime-column">
                            <div 
                              className="ghost-date-wrapper"
                              onClick={(e) => {
                                try { e.currentTarget.querySelector('input').showPicker(); } catch(err) {}
                              }}
                            >
                              <div className="ghost-date-display">
                                📅 {convState.date ? targetDateStr : "Select Date"}
                              </div>
                              <input 
                                type="date" 
                                className="ghost-date-input"
                                value={convState.date || ''}
                                onChange={(e) => handleDateTimeChange(country.name, 'date', e.target.value)}
                              />
                            </div>

                            <div className="time-picker-container">
                              <select 
                                className="time-select" 
                                value={h12} 
                                onChange={(e) => handleTimePartChange('hour', e.target.value)}
                              >
                                {[...Array(12)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>:</span>
                              <select 
                                className="time-select" 
                                value={m} 
                                onChange={(e) => handleTimePartChange('minute', e.target.value)}
                              >
                                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(min => (
                                  <option key={min} value={min}>{min}</option>
                                ))}
                              </select>
                              <div className="ampm-toggle">
                                <button 
                                  className={`ampm-btn ${!isPM ? 'active' : ''}`} 
                                  onClick={() => handleTimePartChange('ampm', 'AM')}
                                >AM</button>
                                <button 
                                  className={`ampm-btn ${isPM ? 'active' : ''}`} 
                                  onClick={() => handleTimePartChange('ampm', 'PM')}
                                >PM</button>
                              </div>
                            </div>
                          </div>
                          
                          {convertedAssociateTime && (
                            <div style={{marginTop: '16px'}}>
                              <div className="converter-result">
                                When it is {targetFormattedTime} {convState.date && `on ${targetDateStr}`} in {country.name}, it will be:
                                <span style={{color: 'var(--color-eu)'}}>{convertedAssociateTime}</span>
                                in <strong>{officeLabels[associateLocation]}</strong>.
                                
                                {isWeekendTarget && (
                                  <div className="date-alert-badge badge-alert-weekend">⚠️ Weekend Appointment</div>
                                )}
                                {isPastTarget && (
                                  <div className="date-alert-badge badge-alert-past">📅 Note: Past Date</div>
                                )}
                              </div>
                              
                              {hasDstWarning && (
                                <div className="dst-warning">
                                  <span>⚠️</span> 
                                  <span><strong>Daylight Saving Shift:</strong> The time difference between your location and {country.name} will change by this date. The converted time shown above is correct and has safely accounted for this shift.</span>
                                </div>
                              )}

                              <button 
                                className="btn-save-log"
                                onClick={() => handleSaveLog(
                                  country.name,
                                  `${targetFormattedTime} ${convState.date ? `on ${targetDateStr}` : ''}`,
                                  convertedAssociateTime
                                )}
                              >
                                Save Log
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => toggleCountry(country.name)} 
                      className="btn-remove"
                    >
                      Remove from Canvas
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOG MODAL OVERLAY */}
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
                        <button 
                          className="log-delete-btn"
                          onClick={() => setAppointmentLogs(prev => prev.filter(l => l.id !== log.id))}
                        >
                          Delete
                        </button>
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
