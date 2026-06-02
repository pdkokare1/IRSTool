// src/components/RightDrawer.jsx

import React from 'react';

export default function RightDrawer({
  isRightDrawerOpen, isFlowGuideExpanded, setIsFlowGuideExpanded, callFlowSteps, completedSteps, 
  currentStepIndex, expandedSteps, toggleStep, toggleExpandStep, customScripts, handleScriptEdit, 
  setCompletedSteps, userNotes, setUserNotes
}) {
  return (
    <div className={`flow-sidebar ${isRightDrawerOpen ? 'open' : 'closed'}`}>
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

      <div className="scratchpad-container">
        <h3 className="scratchpad-header">Workspace Notes</h3>
        <textarea 
          className="scratchpad-textarea"
          placeholder="Jot down quick notes, callback numbers, or key respondent insights here..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
