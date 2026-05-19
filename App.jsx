// App.jsx

import React, { useState, useEffect } from 'react';
import { countries } from './countryData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState(Date.now());
  const [selectedCountries, setSelectedCountries] = useState([]); // Tracks user selections

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

  // Layout Styles
  const styles = {
    layout: { display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', margin: 0 },
    
    // Left Drawer Styles
    drawer: { width: '320px', minWidth: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e1e4e8', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    drawerHeader: { padding: '20px', borderBottom: '1px solid #e1e4e8', backgroundColor: '#f8f9fa' },
    drawerTitle: { margin: '0 0 15px 0', fontSize: '18px', color: '#24292e' },
    searchInput: { width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #d1d5da', boxSizing: 'border-box' },
    drawerScrollArea: { flex: 1, overflowY: 'auto', padding: '10px' },
    listSection: { marginBottom: '20px' },
    listHeader: { fontSize: '12px', textTransform: 'uppercase', color: '#586069', fontWeight: 'bold', margin: '0 0 10px 10px', letterSpacing: '0.5px' },
    listItem: { padding: '10px', margin: '0 0 5px 0', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' },
    listItemUnselected: { backgroundColor: 'transparent', border: '1px solid transparent' },
    listItemSelected: { backgroundColor: '#e6ffed', border: '1px solid #2ea44f' },
    
    // Right Canvas Styles
    canvas: { flex: 1, padding: '40px', overflowY: 'auto' },
    canvasEmpty: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a737d', fontSize: '20px', flexDirection: 'column' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px', alignContent: 'start' },
    
    // Tile Styles
    card: { padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    cardAvailable: { borderTop: '8px solid #2ea44f' },
    cardSoon: { borderTop: '8px solid #dbab09' },
    cardUnavailable: { borderTop: '8px solid #d1d5da' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    countryName: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#24292e' },
    timeText: { fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#24292e' },
    badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 'auto' },
    badgeEU: { backgroundColor: '#003399', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' },
    badgeStatus: { padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' },
    badgeAvailable: { backgroundColor: '#e6ffed', color: '#2ea44f', border: '1px solid #2ea44f' },
    badgeSoon: { backgroundColor: '#fff8c5', color: '#b08800', border: '1px solid #dbab09' },
    badgeUnavailable: { backgroundColor: '#f6f8fa', color: '#6a737d', border: '1px solid #d1d5da' },
    removeBtn: { marginTop: '15px', padding: '8px', width: '100%', backgroundColor: 'transparent', border: '1px solid #d1d5da', borderRadius: '6px', color: '#d73a49', cursor: 'pointer', fontWeight: 'bold' }
  };

  // Reusable component for the sidebar list items
  const DrawerList = ({ title, items, icon }) => {
    if (items.length === 0) return null;
    return (
      <div style={styles.listSection}>
        <h3 style={styles.listHeader}>{icon} {title} ({items.length})</h3>
        {items.map(country => {
          const isSelected = selectedCountries.includes(country.name);
          return (
            <div 
              key={country.name} 
              onClick={() => toggleCountry(country.name)}
              style={{...styles.listItem, ...(isSelected ? styles.listItemSelected : styles.listItemUnselected)}}
            >
              <span style={{fontWeight: isSelected ? 'bold' : 'normal', color: '#24292e'}}>{country.name}</span>
              <span style={{color: '#6a737d', fontSize: '13px'}}>{country.localTimeString}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.layout}>
      
      {/* LEFT DRAWER */}
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>Global Dial Directory</h2>
          <input 
            type="text" 
            placeholder="Search directory..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.drawerScrollArea}>
          <DrawerList title="Good to Call" items={availableList} icon="🟢" />
          <DrawerList title="Soon Available" items={soonList} icon="🟡" />
          <DrawerList title="Outside Hours" items={unavailableList} icon="⚪" />
          
          {filteredForDrawer.length === 0 && (
            <p style={{textAlign: 'center', color: '#6a737d', marginTop: '20px'}}>No matching countries.</p>
          )}
        </div>
      </div>

      {/* RIGHT CANVAS */}
      <div style={styles.canvas}>
        {selectedCountries.length === 0 ? (
          <div style={styles.canvasEmpty}>
            <h2>Your Workspace is Empty</h2>
            <p>Select countries from the directory on the left to track them here.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {activeTiles.map((country) => {
              let cardStyle = styles.cardUnavailable;
              let badgeStyle = styles.badgeUnavailable;
              let statusText = "Outside Hours";

              if (country.callStatus === 'available') {
                cardStyle = styles.cardAvailable;
                badgeStyle = styles.badgeAvailable;
                statusText = "Good to Call";
              } else if (country.callStatus === 'soon') {
                cardStyle = styles.cardSoon;
                badgeStyle = styles.badgeSoon;
                statusText = "Soon Available";
              }

              return (
                <div key={country.name} style={{ ...styles.card, ...cardStyle }}>
                  <div>
                    <div style={styles.cardHeader}>
                      <h2 style={styles.countryName}>{country.name}</h2>
                      <p style={styles.timeText}>{country.localTimeString}</p>
                    </div>
                    <div style={styles.badgeContainer}>
                      {country.isEU && <span style={styles.badgeEU}>🇪🇺 GDPR APPLIES</span>}
                      <span style={{ ...styles.badgeStatus, ...badgeStyle }}>{statusText}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleCountry(country.name)} 
                    style={styles.removeBtn}
                  >
                    Remove from Workspace
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
