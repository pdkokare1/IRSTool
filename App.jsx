// App.jsx

import React, { useState, useEffect } from 'react';
import { countries } from './countryData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState(Date.now());

  // Update the time every 60 seconds so the list stays accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Process and filter the countries
  const processedCountries = countries
    .filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(country => {
      // Get the current time in the target country
      const options = { 
        timeZone: country.timezone, 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const localTimeString = formatter.format(new Date());

      // Get the exact hour (0-23) to determine the status bucket
      const hourOptions = { 
        timeZone: country.timezone, 
        hour: 'numeric', 
        hour12: false 
      };
      const hourFormatter = new Intl.DateTimeFormat('en-US', hourOptions);
      const localHour = parseInt(hourFormatter.format(new Date()), 10);

      // Determine the specific call status
      let callStatus = 'unavailable';
      if (localHour >= 9 && localHour < 17) {
        callStatus = 'available'; // 9 AM to 5 PM
      } else if (localHour >= 7 && localHour < 9) {
        callStatus = 'soon'; // 7 AM to 9 AM
      }

      return {
        ...country,
        localTimeString,
        callStatus
      };
    });

  // Group countries into our three categories
  const availableCountries = processedCountries.filter(c => c.callStatus === 'available');
  const soonCountries = processedCountries.filter(c => c.callStatus === 'soon');
  const unavailableCountries = processedCountries.filter(c => c.callStatus === 'unavailable');

  // Full-screen and tile-based styles
  const styles = {
    container: { fontFamily: 'Arial, sans-serif', width: '100%', padding: '20px', boxSizing: 'border-box', backgroundColor: '#f9f9f9', minHeight: '100vh' },
    header: { textAlign: 'center', color: '#333', marginBottom: '30px' },
    searchContainer: { maxWidth: '800px', margin: '0 auto 40px auto' },
    searchInput: { width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    section: { marginBottom: '50px' },
    sectionTitle: { fontSize: '24px', color: '#444', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #eaeaea', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    
    // Status-specific top borders
    cardAvailable: { borderTop: '6px solid #2ea44f' },
    cardSoon: { borderTop: '6px solid #dbab09' },
    cardUnavailable: { borderTop: '6px solid #d1d5da', opacity: 0.8 },
    
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
    countryName: { fontSize: '22px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#24292e' },
    timeText: { fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#333' },
    
    badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' },
    badgeEU: { backgroundColor: '#003399', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    badgeStatus: { padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    badgeAvailable: { backgroundColor: '#e6ffed', color: '#2ea44f', border: '1px solid #2ea44f' },
    badgeSoon: { backgroundColor: '#fff8c5', color: '#b08800', border: '1px solid #dbab09' },
    badgeUnavailable: { backgroundColor: '#f6f8fa', color: '#6a737d', border: '1px solid #d1d5da' }
  };

  // Reusable Tile Component to keep the JSX clean
  const CountryTile = ({ country }) => {
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
      <div style={{ ...styles.card, ...cardStyle }}>
        <div style={styles.cardHeader}>
          <h2 style={styles.countryName}>{country.name}</h2>
          <p style={styles.timeText}>{country.localTimeString}</p>
        </div>
        <div style={styles.badgeContainer}>
          {country.isEU && <span style={styles.badgeEU}>🇪🇺 GDPR APPLIES</span>}
          <span style={{ ...styles.badgeStatus, ...badgeStyle }}>
            {statusText}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Global Calling & GDPR Dashboard</h1>
      
      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Search for a country..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {availableCountries.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🟢 Good to Call (9 AM - 5 PM)</h2>
          <div style={styles.grid}>
            {availableCountries.map((country, index) => (
              <CountryTile key={index} country={country} />
            ))}
          </div>
        </div>
      )}

      {soonCountries.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🟡 Soon to be Available (7 AM - 9 AM)</h2>
          <div style={styles.grid}>
            {soonCountries.map((country, index) => (
              <CountryTile key={index} country={country} />
            ))}
          </div>
        </div>
      )}

      {unavailableCountries.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚪ Outside Hours</h2>
          <div style={styles.grid}>
            {unavailableCountries.map((country, index) => (
              <CountryTile key={index} country={country} />
            ))}
          </div>
        </div>
      )}

      {processedCountries.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
          No countries found matching your search.
        </p>
      )}
    </div>
  );
}
