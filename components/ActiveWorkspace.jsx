// components/ActiveWorkspace.jsx

import React from 'react';
import { getTzOffsetMins } from '../App';

export default function ActiveWorkspace({
  canvasRef, selectedCountries, activeTiles, converterState, 
  toggleConverter, applyDatePreset, handleDateTimeChange, handleSaveLog, associateLocation, 
  officeLabels, officeTimezones, toggleCountry, isDrawerOpen, setIsDrawerOpen, isRightDrawerOpen, setIsRightDrawerOpen
}) {

  return (
    <>
      <button 
        className={`burger-menu-btn ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        title={isDrawerOpen ? "Hide Directory" : "Show Directory"}
      >
        <span></span><span></span><span></span>
      </button>

      <button 
        className={`right-burger-menu-btn ${isRightDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        title={isRightDrawerOpen ? "Hide Flow Guide" : "Show Flow Guide"}
      >
        <span></span><span></span><span></span>
      </button>

      <div className="canvas" ref={canvasRef}>
        {selectedCountries.length > 0 && (
          <div className="workspace-header">
            <h2 className="workspace-title">Active Workspace</h2>
          </div>
        )}

        {selectedCountries.length === 0 ? (
          <div className="canvas-empty">
            <h2>Your Workspace is Empty</h2>
            <p>Select targets from the directory on the left to pin them to your active calling dashboard.</p>
          </div>
        ) : (
          <div className="list-view-container">
            {activeTiles.map((country) => {
              let cardClass = 'card-bad';
              let badgeClass = 'badge-bad';
              let statusText = "Outside Hours";

              if (country.callStatus === 'available') {
                cardClass = 'card-good'; badgeClass = 'badge-good'; statusText = "Good to Call";
              } else if (country.callStatus === 'soon') {
                cardClass = 'card-soon'; badgeClass = 'badge-soon'; statusText = "Soon Available";
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
                  if (dayOfWeek === 0 || dayOfWeek === 6) isWeekendTarget = true;
                  const todayNoon = new Date();
                  todayNoon.setHours(0,0,0,0);
                  if (selectedDateObj < todayNoon) isPastTarget = true;
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
                  if (futureDiffMins !== country.diffMins) hasDstWarning = true;

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

              const ConverterPanelContent = () => (
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
                    <div className="ghost-date-wrapper" onClick={(e) => { try { e.currentTarget.querySelector('input').showPicker(); } catch(err) {} }}>
                      <div className="ghost-date-display">📅 {convState.date ? targetDateStr : "Select Date"}</div>
                      <input type="date" className="ghost-date-input" value={convState.date || ''} onChange={(e) => handleDateTimeChange(country.name, 'date', e.target.value)} />
                    </div>

                    <div className="time-picker-container">
                      <select className="time-select" value={h12} onChange={(e) => handleTimePartChange('hour', e.target.value)}>
                        {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>:</span>
                      <select className="time-select" value={m} onChange={(e) => handleTimePartChange('minute', e.target.value)}>
                        {['00','05','10','15','20','25','30','35','40','45','50','55'].map(min => <option key={min} value={min}>{min}</option>)}
                      </select>
                      <div className="ampm-toggle">
                        <button className={`ampm-btn ${!isPM ? 'active' : ''}`} onClick={() => handleTimePartChange('ampm', 'AM')}>AM</button>
                        <button className={`ampm-btn ${isPM ? 'active' : ''}`} onClick={() => handleTimePartChange('ampm', 'PM')}>PM</button>
                      </div>
                    </div>
                  </div>
                  
                  {convertedAssociateTime && (
                    <div style={{marginTop: '16px'}}>
                      <div className="converter-result">
                        When it is {targetFormattedTime} {convState.date && `on ${targetDateStr}`} in {country.name}, it will be:
                        <span style={{color: 'var(--color-eu)'}}>{convertedAssociateTime}</span>
                        in <strong>{officeLabels[associateLocation]}</strong>.
                        {isWeekendTarget && <div className="date-alert-badge badge-alert-weekend">⚠️ Weekend Appointment</div>}
                        {isPastTarget && <div className="date-alert-badge badge-alert-past">📅 Note: Past Date</div>}
                      </div>
                      
                      {hasDstWarning && (
                        <div className="dst-warning">
                          <span>⚠️</span> 
                          <span><strong>Daylight Saving Shift:</strong> The time difference between your location and {country.name} will change by this date. The converted time shown above is safely accounted for this shift.</span>
                        </div>
                      )}

                      <button 
                        className="btn-save-log"
                        onClick={() => handleSaveLog(country.name, `${targetFormattedTime} ${convState.date ? `on ${targetDateStr}` : ''}`, convertedAssociateTime)}
                      >
                        Save Log
                      </button>
                    </div>
                  )}
                </div>
              );

              const listThemeClass = `list-${cardClass.split('-')[1]}`;
              
              return (
                <div key={country.name} className={`list-row-wrapper ${listThemeClass}`}>
                  <div className="list-row">
                    
                    {/* GROUP 1: NAME AND GDPR */}
                    <div className="list-group list-group-main">
                      <h2 className="list-name">{country.name}</h2>
                      {country.isEU && <span className="badge badge-eu">🇪🇺 GDPR</span>}
                    </div>
                    
                    {/* GROUP 2: TIME AND OFFSET */}
                    <div className="list-group list-group-time">
                      <p className="list-time">{country.localTimeString}</p>
                      <p className="list-offset">{country.offsetText}</p>
                    </div>

                    {/* GROUP 3: ACTIONS */}
                    <div className="list-group-actions">
                      <span className={`badge ${badgeClass}`}>{statusText}</span>
                      <button onClick={() => toggleConverter(country.name)} className="btn-toggle-converter">
                        Convert Time
                      </button>
                      <button onClick={() => toggleCountry(country.name)} className="btn-remove-icon" title="Remove from Workspace">
                        &times;
                      </button>
                    </div>
                    
                  </div>
                  {convState.isOpen && (
                    <div className="list-converter-wrap">
                       <ConverterPanelContent />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
