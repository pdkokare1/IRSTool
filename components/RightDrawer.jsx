// components/RightDrawer.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function RightDrawer({
  isRightDrawerOpen, setIsRightDrawerOpen, isFlowGuideExpanded, setIsFlowGuideExpanded, callFlowSteps, completedSteps, 
  currentStepIndex, expandedSteps, toggleStep, toggleExpandStep, customScripts, handleScriptEdit, 
  setCompletedSteps, userNotes, setUserNotes
}) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => parseInt(localStorage.getItem('rightDrawerWidth_v1')) || 340);
  const isResizing = useRef(false);

  // Auto-minimize the workspace notes if the user opens the Call Flow Guide
  useEffect(() => {
    if (isFlowGuideExpanded) {
      setIsNotesOpen(false);
    }
  }, [isFlowGuideExpanded]);

  // Persist drawer width layout to local storage
  useEffect(() => {
    localStorage.setItem('rightDrawerWidth_v1', drawerWidth);
  }, [drawerWidth]);

  // Handle Drag logic
  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = document.body.clientWidth - e.clientX;
    if (newWidth >= 280 && newWidth <= 800) {
      setDrawerWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e) => {
    isResizing.current = true;
    document.body.style.userSelect = 'none'; 
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  let notesClass = 'closed';
  if (!isFlowGuideExpanded) {
    notesClass = 'full';
  } else if (isNotesOpen) {
    notesClass = 'open';
  }

  const handleNotesToggle = () => {
    if (!isFlowGuideExpanded) {
      setIsFlowGuideExpanded(true);
    } else {
      setIsNotesOpen(!isNotesOpen);
    }
  };

  return (
    <div 
      className={`flow-sidebar ${isRightDrawerOpen ? 'open' : 'closed'}`}
      style={{ '--right-drawer-width': `${drawerWidth}px` }}
    >
      {/* Moved Burger Menu to outer left edge of Right Drawer */}
      <button 
        className={`right-burger-menu-btn ${isRightDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        title={isRightDrawerOpen ? "Hide Flow Guide" : "Show Flow Guide"}
      >
        <span></span><span></span><span></span>
      </button>

      <div 
        className="drawer-resizer" 
        onMouseDown={handleMouseDown}
        title="Drag to resize panel"
      ></div>

      <div className="flow-title" onClick={() => setIsFlowGuideExpanded(!isFlowGuideExpanded)}>
        <span>Call Flow Guide</span>
        <span className={`caret ${isFlowGuideExpanded ? 'open' : ''}`}>▼</span>
      </div>

      {isFlowGuideExpanded && (
        <div className="flow-scroll">
          {callFlowSteps.map((step, index) => {
            const isDone = completedSteps.includes(step);
            const isCurrent = index === currentStepIndex;
            const isExpanded = expandedSteps.includes(step);

            let dynamicClass = 'future';
            if (isDone) dynamicClass = 'done';
            else if (isCurrent) dynamicClass = 'current';

            return (
              <div key={step} className={`flow-item ${dynamicClass}`} onClick={() => toggleStep(step)}>
                <div className="flow-row-top">
                  <div className="flow-checkbox"></div>
                  <div className="flow-text-container">
                    <span className="flow-num">Step {String(index + 1).padStart(2, '0')}</span>
                    <span className="flow-name">{step}</span>
                  </div>
                  <button 
                    className={`flow-expand-trigger ${isExpanded ? 'rotated' : ''}`}
                    onClick={(e) => toggleExpandStep(step, e)}
                    title="Toggle Step Script Panel"
                  >
                    ▼
                  </button>
                </div>

                {isExpanded && (
                  <div className="flow-script-panel" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      className="flow-textarea"
                      placeholder="Type customized call narrative script here..."
                      value={customScripts[step] || ''}
                      onChange={(e) => handleScriptEdit(step, e.target.value)}
                    />
                    <div className="flow-script-actions">
                      <button 
                        className="btn-save-script"
                        onClick={() => {
                          localStorage.setItem('callFlowScripts_v1', JSON.stringify(customScripts));
                          alert(`Script configuration saved for ${step}!`);
                        }}
                      >
                        Save Script
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          <button className="btn-reset-flow" onClick={() => setCompletedSteps([])}>
            Reset Progress
          </button>
        </div>
      )}

      {/* Workspace Notes Bottom Drawer */}
      <div className={`scratchpad-container ${notesClass}`}>
        <div className="scratchpad-header" onClick={handleNotesToggle}>
          <span>Workspace Notes</span>
          <span className={`caret ${notesClass !== 'closed' ? 'open' : ''}`}>▲</span>
        </div>
        <div className="scratchpad-body">
          <textarea 
            className="scratchpad-textarea"
            placeholder="Jot down quick notes, callback numbers, or key respondent insights here..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
          />
        </div>
      </div>
      
    </div>
  );
}
