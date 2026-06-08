// src/components/ActiveWorkspace.jsx

import React, { useState, useRef, useEffect } from 'react';
import { getTzOffsetMins } from '../App';

export default function ActiveWorkspace({
  canvasRef, selectedCountries, activeTiles, converterState, 
  toggleConverter, applyDatePreset, handleDateTimeChange, handleSaveLog, associateLocation, 
  officeLabels, officeTimezones, toggleCountry, isDrawerOpen, setIsDrawerOpen, isRightDrawerOpen, setIsRightDrawerOpen,
  projects, activeProjectId, setActiveProjectId, openNewProjectModal, deleteProject,
  filters, handleFilterChange, sortOption, setSortOption
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  return (
    <div className="canvas" ref={canvasRef}>
      
      {/* ALWAYS VISIBLE HEADER */}
      <div className="workspace-header">
        
        {/* LEFT: Project Controls */}
        <div className="header-left">
          <select 
            className="project-dropdown"
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            title="Switch Active Project"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn-project-add" onClick={openNewProjectModal} title="Create New Project">+</button>
        </div>

        {/* CENTER: Title */}
        <h2 className="workspace-title">Workspace</h2>

        {/* RIGHT: Filters and Sort */}
        <div className="header-right">
          <div className="filter-container" style={{ position: 'relative' }} ref={filterRef}>
            <button 
              className={`btn-header ${isFilterOpen ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filters {filters.all ? '(All)' : `(${[filters.available, filters.soon, filters.unavailable].filter(Boolean).length})`} ▼
            </button>
            
            {isFilterOpen && (
              <div className="filter-dropdown-menu">
                <label className="filter-option">
                  <input type="checkbox" checked={filters.all} onChange={() => handleFilterChange('all')} />
                  <span>Show All</span>
                </label>
                <div className="filter-divider"></div>
                <label className="filter-option">
                  <input type="checkbox" checked={filters.available} onChange={() => handleFilterChange('available')} />
                  <span className="status-dot dot-good" style={{marginLeft: '8px', marginRight: '4px', display: 'inline-block'}}></span>
                  Good to Call
                </label>
                <label className="filter-option">
                  <input type="checkbox" checked={filters.soon} onChange={() => handleFilterChange('soon')} />
                  <span className="status-dot dot-soon" style={{marginLeft: '8px', marginRight: '4px', display: 'inline-block'}}></span>
                  Soon Available
                </label>
                <label className="filter-option">
                  <input type="checkbox" checked={filters.unavailable} onChange={() => handleFilterChange('unavailable')} />
                  <span className="status-dot dot-bad" style={{marginLeft: '8px', marginRight: '4px', display: 'inline-block'}}></span>
                  Outside Hours
                </label>
              </div>
            )}
          </div>

          <select 
            className="btn-header sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="alpha-asc">Sort: A - Z</option>
            <option value="alpha-desc">Sort: Z - A</option>
            <option value="time-asc">Sort: Time (Earliest)</option>
            <option value="time-desc">Sort: Time (Latest)</option>
          </select>
        </div>

      </div>

      {activeTiles.length === 0 ? (
        <div className="canvas-empty">
          {selectedCountries.length > 0 ? (
            <>
              <h2>No Countries Match Your Filters</h2>
              <p>Adjust your filter settings in the top right to view hidden targets.</p>
            </>
          ) : (
            <>
              <h2>Your Workspace is Empty</h2>
              <p>Select targets from the directory on the left to pin them to your active calling dashboard.</p>
            </>
          )}
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
                  <label>Appointment Time Converter & Logger</label>
                  <button className="btn-close" style={{position: 'absolute'}} onClick={() => toggleConverter(country.name)}>&times;</button>
                </div>
                
                <div className="converter-split">
                  <div className="converter-left">
                    {convertedAssociateTime ? (
                      <>
                        <div className="converter-result">
                          When it is {targetFormattedTime} {convState.date && `on ${targetDateStr}`} in {country.name}, it will be:
                          <span style={{color: 'var(--color-eu)'}}>{convertedAssociateTime}</span>
                          in <strong>{officeLabels[associateLocation]}</strong>.
                        </div>
                        
                        <div style={{marginTop: '4px', textAlign: 'center'}}>
                          {isWeekendTarget && <div className="date-alert-badge badge-alert-weekend">⚠️ Weekend</div>}
                          {isPastTarget && <div className="date-alert-badge badge-alert-past">📅 Past Date</div>}
                        </div>

                        {hasDstWarning && (
                          <div className="dst-warning">
                            <span>⚠️ <strong>Daylight Saving Shift:</strong></span> 
                            <span>The time difference between your location and {country.name} will change by this date. Safely accounted for.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', display: 'flex', height: '100%', minHeight: '120px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F1F5F9', borderRadius: '8px', padding: '16px' }}>
                        Select a target date and time to calculate associate local time.
                      </div>
                    )}
                  </div>

                  <div className="converter-right">
                    <div className="preset-container">
                      <button className="preset-btn" onClick={() => applyDatePreset(country.name, 0)}>Today</button>
                      <button className="preset-btn" onClick={() => applyDatePreset(country.name, 1)}>Tomorrow</button>
                      <button className="preset-btn" onClick={() => applyDatePreset(country.name, 2)}>Day After</button>
                    </div>

                    <div className="datetime-column">
                      <div className="ghost-date-wrapper" onClick={(e) => { try { e.currentTarget.querySelector('input').showPicker(); } catch(err) {} }}>
                        <div className="ghost-date-display">📅 {convState.date ? targetDateStr : "Date"}</div>
                        <input type="date" className="ghost-date-input" value={convState.date || ''} onChange={(e) => handleDateTimeChange(country.name, 'date', e.target.value)} />
                      </div>

                      <div className="time-picker-container">
                        <select className="time-select" value={h12} onChange={(e) => handleTimePartChange('hour', e.target.value)}>
                          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                        </select>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                        <select className="time-select" value={m} onChange={(e) => handleTimePartChange('minute', e.target.value)}>
                          {['00','05','10','15','20','25','30','35','40','45','50','55'].map(min => <option key={min} value={min}>{min}</option>)}
                        </select>
                        <div className="ampm-toggle" style={{marginLeft: '6px'}}>
                          <button className={`ampm-btn ${!isPM ? 'active' : ''}`} onClick={() => handleTimePartChange('ampm', 'AM')}>AM</button>
                          <button className={`ampm-btn ${isPM ? 'active' : ''}`} onClick={() => handleTimePartChange('ampm', 'PM')}>PM</button>
                        </div>
                      </div>
                    </div>

                    {convertedAssociateTime && (
                      <button 
                        className="btn-save-log"
                        onClick={() => handleSaveLog(country.name, `${targetFormattedTime} ${convState.date ? `on ${targetDateStr}` : ''}`, convertedAssociateTime)}
                      >
                        Save Appointment to Log
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );

            const listThemeClass = `list-${cardClass.split('-')[1]}`;
            
            return (
              <div key={country.name} className={`list-row-wrapper ${listThemeClass}`}>
                <div className="list-row">
                  
                  <div className="list-group list-group-main">
                    <h2 className="list-name">{country.name}</h2>
                    {country.isEU && <span className="badge badge-eu">🇪🇺 GDPR</span>}
                  </div>
                  
                  <div className="list-group list-group-time">
                    <p className="list-time">{country.localTimeString}</p>
                    <p className="list-offset">{country.offsetText}</p>
                  </div>

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

      {/* BOTTOM ACTION ZONE: Delete Current Project */}
      <div className="delete-project-zone">
        <button 
          className="btn-delete-project-bottom" 
          onClick={() => deleteProject(activeProjectId)}
          title="Delete this project permanently"
        >
          <span style={{ fontSize: '16px' }}>🗑️</span> Delete Project
        </button>
      </div>

    </div>
  );
}
