// App.jsx

import React, { useState, useEffect } from 'react';
import { countries } from './countryData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState(Date.now());
  
  // Initialize state from localStorage to persist data across refreshes
  const [associateLocation, setAssociateLocation] = useState(() => {
    return localStorage.getItem('associateLocation') || 'US';
  });
  
  const [selectedCountries, setSelectedCountries] = useState(() => {
    const saved = localStorage.getItem('selectedCountries');
    return saved ? JSON.parse(saved) : [];
  });

  // Save location to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('associateLocation', associateLocation);
  }, [associateLocation]);

  // Save active canvas targets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedCountries', JSON.stringify(selectedCountries));
  }, [selectedCountries]);

  // Update the time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTicker(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Process time and status for all countries
  const processedCountries = countries.map(country => {
    const options = { timeZone: country.timezone, hour: 'numeric', minute: 'numeric', hour12: true };
    const localTimeString = new Intl.DateTimeFormat('en-US', options).format(new Date());

    const hourOptions = { timeZone: country.timezone, hour: 'numeric', hour12: false };
    const localHour = parseInt(new Intl.DateTimeFormat('en-US', hourOptions).format(new Date()), 10);

    let callStatus = 'unavailable';
    if (localHour >= 9 && localHour < 17) callStatus = 'available';
    else if (localHour >= 7 && localHour < 9) callStatus = 'soon';

    return { ...country, localTimeString, callStatus };
  });

  // Filter drawer list based on search
  const filteredForDrawer = processedCountries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group the drawer list
  const availableList = filteredForDrawer.filter(c => c.callStatus === 'available');
  const soonList = filteredForDrawer.filter(c => c.callStatus === 'soon');
  const unavailableList = filteredForDrawer.filter(c => c.callStatus === 'unavailable');

  // Group the active canvas tiles
  const activeTiles = processedCountries.filter(c => selectedCountries.includes(c.name));

  // Handle adding/removing from the canvas
  const toggleCountry = (countryName) => {
    if (selectedCountries.includes(countryName)) {
      setSelectedCountries(selectedCountries.filter(name => name !== countryName));
    } else {
      setSelectedCountries([...selectedCountries, countryName]);
    }
  };

  // Reusable component for the sidebar list items
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
                <span className="country-name">{country.name}</span>
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
      {/* Embedded CSS for Premium Styling */}
      <style>{`
        :root {
          --bg-main: #F4F7F9;
          --bg-gradient: linear-gradient(135deg, #F4F7F9 0%, #E8EEF2 100%);
          --bg-drawer: #FFFFFF;
          --text-main: #0F172A;
          --text-muted: #64748B;
          --border: #E2E8F0;
          
          /* Premium Shadows */
          --shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.04);
          --shadow-card: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -5px rgba(15, 23, 42, 0.04);
          --shadow-hover: 0 20px 35px -10px rgba(15, 23, 42, 0.12), 0 10px 15px -5px rgba(15, 23, 42, 0.08);
          
          /* Vibrant Status Colors */
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
        
        .layout { display: flex; height: 100vh; overflow: hidden; }
        
        /* Drawer Styles */
        .drawer { width: 360px; min-width: 360px; background-color: var(--bg-drawer); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 10; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.03); }
        .drawer-header { padding: 28px 24px 20px; border-bottom: 1px solid var(--border); }
        .drawer-title { margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: var(--text-main); letter-spacing: -0.03em; }
        
        /* Premium Dropdown Selector */
        .location-dropdown { width: 100%; padding: 12px 16px; font-size: 14px; font-weight: 600; color: var(--text-main); background-color: #F1F5F9; border: 1px solid transparent; border-radius: 10px; margin-bottom: 20px; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; transition: all 0.2s; }
        .location-dropdown:hover { background-color: #E2E8F0; }
        .location-dropdown:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }

        .search-input { width: 100%; padding: 14px 16px; font-size: 14px; border-radius: 10px; border: 1px solid var(--border); box-sizing: border-box; outline: none; transition: all 0.2s; background-color: #F8FAFC; color: var(--text-main); }
        .search-input:focus { border-color: var(--color-eu); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); background-color: #FFF; }
        .search-input::placeholder { color: #94A3B8; }
        
        .drawer-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; }
        
        /* List Styles */
        .list-section { margin-bottom: 28px; }
        .list-header { font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 14px 0; letter-spacing: 0.08em; display: flex; align-items: center; }
        .list-header .count { margin-left: 6px; opacity: 0.7; font-weight: 600; }
        .list-item { padding: 12px 14px; margin: 0 -14px 6px -14px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; user-select: none; border: 1px solid transparent; }
        .list-item:hover { background-color: #F1F5F9; transform: translateX(2px); }
        .list-item.selected { background-color: var(--bg-good); border-color: rgba(16, 185, 129, 0.25); transform: translateX(2px); }
        .list-item-left { display: flex; align-items: center; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 14px; }
        .dot-good { background: var(--grad-good); box-shadow: 0 0 0 3px var(--bg-good); }
        .dot-soon { background: var(--grad-soon); box-shadow: 0 0 0 3px var(--bg-soon); }
        .dot-bad { background: var(--grad-bad); }
        .country-name { font-weight: 600; font-size: 14px; color: #334155; }
        .selected .country-name { color: #065F46; }
        .time-preview { font-size: 13px; color: var(--text-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
        
        /* Canvas Styles */
        .canvas { flex: 1; padding: 56px; overflow-y: auto; }
        .canvas-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; animation: fadeIn 0.5s ease-in-out; }
        .canvas-empty h2 { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; letter-spacing: -0.03em; }
        .canvas-empty p { font-size: 16px; max-width: 420px; line-height: 1.6; color: #64748B; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 28px; align-content: start; }
        
        /* Premium Card Styles */
        .card { background-color: #FFF; padding: 28px; border-radius: 20px; display: flex; flex-direction: column; box-shadow: var(--shadow-card); border: 1px solid rgba(255,255,255,0.8); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; animation: slideUp 0.4s ease-out; }
        .card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; }
        .card-good::before { background: var(--grad-good); }
        .card-soon::before { background: var(--grad-soon); }
        .card-bad::before { background: var(--grad-bad); }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .card-country { font-size: 24px; font-weight: 800; margin: 0 0 6px 0; color: var(--text-main); letter-spacing: -0.03em; }
        .card-time { font-size: 36px; font-weight: 900; margin: 0; color: var(--text-main); font-variant-numeric: tabular-nums; letter-spacing: -0.04em; line-height: 1; }
        
        .badges { display: flex; gap: 10px; flex-wrap: wrap; margin-top: auto; margin-bottom: 24px; }
        .badge { padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.03em; display: inline-flex; align-items: center; }
        .badge-eu { background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); }
        .badge-good { background-color: var(--bg-good); color: #047857; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-soon { background-color: var(--bg-soon); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-bad { background-color: var(--bg-bad); color: #475569; border: 1px solid rgba(148, 163, 184, 0.2); }
        
        .btn-remove { width: 100%; padding: 12px; background-color: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; color: var(--text-muted); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .btn-remove:hover { background-color: #FEF2F2; color: #EF4444; border-color: #FECACA; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="layout">
        {/* LEFT DRAWER */}
        <div className="drawer">
          <div className="drawer-header">
            <h2 className="drawer-title">Global Directory</h2>
            
            {/* Persisted Location Dropdown */}
            <select 
              className="location-dropdown"
              value={associateLocation}
              onChange={(e) => setAssociateLocation(e.target.value)}
            >
              <option value="IN">🇮🇳 India Office</option>
              <option value="US">🇺🇸 US Office</option>
              <option value="UK">🇬🇧 UK Office</option>
            </select>

            <input 
              type="text" 
              placeholder="Search countries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="drawer-scroll">
            <DrawerList title="Good to Call" items={availableList} dotClass="dot-good" />
            <DrawerList title="Soon Available" items={soonList} dotClass="dot-soon" />
            <DrawerList title="Outside Hours" items={unavailableList} dotClass="dot-bad" />
            
            {filteredForDrawer.length === 0 && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '14px', fontWeight: '500'}}>No matching countries found.</p>
            )}
          </div>
        </div>

        {/* RIGHT CANVAS */}
        <div className="canvas">
          {selectedCountries.length === 0 ? (
            <div className="canvas-empty">
              <h2>Your Workspace is Empty</h2>
              <p>Select targets from the directory on the left to pin them to your active calling dashboard.</p>
            </div>
          ) : (
            <div className="grid">
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

                return (
                  <div key={country.name} className={`card ${cardClass}`}>
                    <div>
                      <div className="card-header">
                        <h2 className="card-country">{country.name}</h2>
                        <p className="card-time">{country.localTimeString}</p>
                      </div>
                      <div className="badges">
                        {country.isEU && <span className="badge badge-eu">🇪🇺 GDPR</span>}
                        <span className={`badge ${badgeClass}`}>{statusText}</span>
                      </div>
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
      </div>
    </>
  );
}
