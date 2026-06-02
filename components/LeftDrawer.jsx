// src/components/LeftDrawer.jsx

import React from 'react';

export default function LeftDrawer({
  isDrawerOpen, associateLocation, setAssociateLocation, searchQuery, setSearchQuery,
  regionFilter, setRegionFilter, callWindowStart, setCallWindowStart, callWindowEnd, setCallWindowEnd,
  availableList, soonList, unavailableList, selectedCountries, toggleCountry, appointmentLogs, setIsLogModalOpen
}) {
  
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
        
        {(availableList.length + soonList.length + unavailableList.length) === 0 && (
          <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '14px', fontWeight: '500'}}>No matching countries found.</p>
        )}
      </div>

      <div className="drawer-settings">
        <div>
          <h3 className="settings-title" style={{ marginBottom: '10px' }}>Target Business Hours</h3>
          <div className="settings-row">
            <select className="settings-select" value={callWindowStart} onChange={(e) => setCallWindowStart(parseInt(e.target.value))}>
              <option value={7}>07:00 AM</option><option value={8}>08:00 AM</option>
              <option value={9}>09:00 AM</option><option value={10}>10:00 AM</option>
            </select>
            <span className="settings-label">to</span>
            <select className="settings-select" value={callWindowEnd} onChange={(e) => setCallWindowEnd(parseInt(e.target.value))}>
              <option value={15}>03:00 PM</option><option value={16}>04:00 PM</option>
              <option value={17}>05:00 PM</option><option value={18}>06:00 PM</option>
              <option value={19}>07:00 PM</option>
            </select>
          </div>
        </div>
        <button className="btn-view-logs" onClick={() => setIsLogModalOpen(true)}>
          View Appointment Logs {appointmentLogs.length > 0 && `(${appointmentLogs.length})`}
        </button>
      </div>
    </div>
  );
}
