import { useState } from 'react';
import './EffectPicker.css';

export const EffectPicker = ({effect, source, onPick}) => {
    const [showPicker, setShowPicker] = useState(false);

    const selectEffect = (index) => {
        setShowPicker(false);
        onPick(index);
    };

    return (
        <div className="effect-picker">
            <div className={showPicker === true ? "effect-dialog dialog-shown" : "effect-dialog"}>
                <div className="effect-overlay" onClick={() => setShowPicker(false)}></div>
                <div className='effect-modal'>
                    <div className='effect-header'>
                        <span>Select effect</span>
                        <div className='effect-close' onClick={() => setShowPicker(false)}>✕</div>
                    </div>
                    <div className='effect-grid'>
                        {source.map((item, index) => {
                            return <div className={index === effect ? "selected" : ""} key={index} onClick={() => selectEffect(index)}>{item}</div>
                        })}
                    </div>
                </div>
            </div>
            <div className="effect-button" onClick={() => setShowPicker(true)}>
                <span className='effect-name'>{source[effect] !== undefined ? source[effect] : "-"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/></svg>
            </div>
        </div>
    );
};
