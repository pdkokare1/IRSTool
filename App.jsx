// App.jsx

import React, { useState, useEffect } from 'react';
import { countries } from './countryData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState(Date.now());
  const [selectedCountries, setSelectedCountries] = useState([]);

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
          --bg-main: #F3F4F6;
          --bg-drawer: #FFFFFF;
          --text-main: #111827;
          --text-muted: #6B7280;
          --border: #E5E7EB;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          
          /* Status Colors */
          --color-good: #10B981;
          --bg-good: #ECFDF5;
          --color-soon: #F59E0B;
          --bg-soon: #FFFBEB;
          --color-bad: #9CA3AF;
          --bg-bad: #F9FAFB;
          --color-eu: #3B82F6;
        }

        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: var(--bg-main); color: var(--text-main); }
        
        .layout { display: flex; height: 100vh; overflow: hidden; }
        
        /* Drawer Styles */
        .drawer { width: 340px; min-width: 340px; background-color: var(--bg-drawer); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 10; box-shadow: var(--shadow-sm); }
        .drawer-header { padding: 24px; border-bottom: 1px solid var(--border); }
        .drawer-title { margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: var(--text-main); letter-spacing: -0.5px; }
        .search-input { width: 100%; padding: 12px 16px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); box-sizing: border-box; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background-color: #F9FAFB; }
        .search-input:focus { border-color: var(--color-eu); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); background-color: #FFF; }
        .drawer-scroll { flex: 1; overflow-y: auto; padding: 16px 24px; }
        
        /* List Styles */
        .list-section { margin-bottom: 24px; }
        .list-header { font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 0 0 12px 0; letter-spacing: 0.05em; display: flex; align-items: center; }
        .list-header .count { margin-left: 6px; opacity: 0.6; }
        .list-item { padding: 10px 12px; margin: 0 -12px 4px -12px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; user-select: none; border: 1px solid transparent; }
        .list-item:hover { background-color: #F3F4F6; }
        .list-item.selected { background-color: var(--bg-good); border-color: rgba(16, 185, 129, 0.2); }
        .list-item-left { display: flex; align-items: center; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; }
        .dot-good { background-color: var(--color-good); box-shadow: 0 0 0 2px var(--bg-good); }
        .dot-soon { background-color: var(--color-soon); box-shadow: 0 0 0 2px var(--bg-soon); }
        .dot-bad { background-color: var(--color-bad); }
        .country-name { font-weight: 500; font-size: 14px; }
        .selected .country-name { color: var(--color-good); font-weight: 600; }
        .time-preview { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
        
        /* Canvas Styles */
        .canvas { flex: 1; padding: 48px; overflow-y: auto; background-color: var(--bg-main); }
        .canvas-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; }
        .canvas-empty h2 { font-size: 24px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
        .canvas-empty p { font-size: 16px; max-width: 400px; line-height: 1.5; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; align-content: start; }
        
        /* Card Styles */
        .card { background-color: #FFF; padding: 24px; border-radius: 16px; display: flex; flex-direction: column; box-shadow: var(--shadow-sm); border: 1px solid var(--border); transition: transform 0.2s ease, box-shadow 0.2s ease; position: relative; overflow: hidden; }
        .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; }
        .card-good::before { background-color: var(--color-good); }
        .card-soon::before { background-color: var(--color-soon); }
        .card-bad::before { background-color: var(--color-bad); }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .card-country { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; color: var(--text-main); letter-spacing: -0.5px; }
        .card-time { font-size: 32px; font-weight: 800; margin: 0; color: var(--text-main); font-variant-numeric: tabular-nums; letter-spacing: -1px; }
        
        .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; margin-bottom: 20px; }
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; display: inline-flex; align-items: center; }
        .badge-eu { background-color: #EFF6FF; color: var(--color-eu); border: 1px solid rgba(59, 130, 246, 0.2); }
        .badge-good { background-color: var(--bg-good); color: #047857; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-soon { background-color: var(--bg-soon); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-bad { background-color: var(--bg-bad); color: #4B5563; border: 1px solid rgba(156, 163, 175, 0.2); }
        
        .btn-remove { width: 100%; padding: 10px; background-color: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-remove:hover { background-color: #FEF2F2; color: #EF4444; border-color: #FECACA; }
      `}</style>

      <div className="layout">
        {/* LEFT DRAWER */}
        <div className="drawer">
          <div className="drawer-header">
            <h2 className="drawer-title">Global Directory</h2>
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
              <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px', fontSize: '14px'}}>No matching countries found.</p>
            )}
          </div>
        </div>

        {/* RIGHT CANVAS */}
        <div className="canvas">
          {selectedCountries.length === 0 ? (
            <div className="canvas-empty">
              <h2>Your workspace is empty</h2>
              <p>Select countries from the directory on the left to pin them to your active dashboard.</p>
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
