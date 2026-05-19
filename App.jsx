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

  // Process, filter, and sort the countries automatically
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

      // Get the exact hour (0-23) to determine if it is business hours
      const hourOptions = { 
        timeZone: country.timezone, 
        hour: 'numeric', 
        hour12: false 
      };
      const hourFormatter = new Intl.DateTimeFormat('en-US', hourOptions);
      const localHour = parseInt(hourFormatter.format(new Date()), 10);

      // Define business hours as 9 AM (9) to 5 PM (17)
      const isGoodToCall = localHour >= 9 && localHour < 17;

      return {
        ...country,
        localTimeString,
        isGoodToCall
      };
    })
    .sort((a, b) => {
      // Bring "Good to Call" (true) to the top
      if (a.isGoodToCall === b.isGoodToCall) {
        return a.name.localeCompare(b.name); // Alphabetical secondary sort
      }
      return a.isGoodToCall ? -1 : 1;
    });

  // Simple, robust styling variables
  const styles = {
    container: { fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px' },
    header: { textAlign: 'center', color: '#333' },
    searchInput: { width: '100%', padding: '15px', fontSize: '18px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' },
    card: { padding: '20px', marginBottom: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eaeaea' },
    goodToCall: { backgroundColor: '#e6ffed', borderLeft: '6px solid #2ea44f' },
    doNotCall: { backgroundColor: '#f6f8fa', borderLeft: '6px solid #d1d5da', color: '#6a737d' },
    countryName: { fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' },
    timeText: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
    badgeContainer: { display: 'flex', gap: '10px', marginTop: '10px' },
    badgeEU: { backgroundColor: '#003399', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    badgeStatus: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    badgeStatusGood: { backgroundColor: '#2ea44f', color: 'white' },
    badgeStatusBad: { backgroundColor: '#6a737d', color: 'white' }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Global Calling & GDPR Dashboard</h1>
      
      <input 
        type="text" 
        placeholder="Search for a country..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={styles.searchInput}
      />

      <div>
        {processedCountries.map((country, index) => (
          <div 
            key={index} 
            style={{ 
              ...styles.card, 
              ...(country.isGoodToCall ? styles.goodToCall : styles.doNotCall) 
            }}
          >
            <div>
              <h2 style={styles.countryName}>{country.name}</h2>
              <div style={styles.badgeContainer}>
                {country.isEU && <span style={styles.badgeEU}>🇪🇺 GDPR APPLIES</span>}
                <span style={{ 
                  ...styles.badgeStatus, 
                  ...(country.isGoodToCall ? styles.badgeStatusGood : styles.badgeStatusBad) 
                }}>
                  {country.isGoodToCall ? "Good to Call" : "Outside Hours"}
                </span>
              </div>
            </div>
            
            <div>
              <p style={styles.timeText}>{country.localTimeString}</p>
            </div>
          </div>
        ))}

        {processedCountries.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>No countries found.</p>
        )}
      </div>
    </div>
  );
}
