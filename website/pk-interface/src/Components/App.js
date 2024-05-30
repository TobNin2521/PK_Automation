import { useEffect, useState } from 'react';
import React, { useRef } from 'react';
import { Post } from '../Logik/Network';
import './App.css';
import { Automation } from './Automation/Automation';
import { Spotify } from './Spotify/Spotify';

export const App = () => {
  const [screenSaverTimeout, setScreenSaverTimeout] = useState(5);
  const [toggleScreenSaver, setToggleScreenSaver] = useState(false);
  
  useInterval(() => {
      setScreenSaverTimeout((prevVal) => prevVal - 1);
  }, 5 * 60 * 1000);

  useEffect(() => {
    if(screenSaverTimeout <= 0) {
      setToggleScreenSaver(true);
    }
  }, [screenSaverTimeout]);

  const resetScrennsaver = () => {
    console.log("Reset timer");
    setScreenSaverTimeout(5);
    setToggleScreenSaver(false);
  };

  return (
    <div className="App" onClick={resetScrennsaver}>
      <div className='left-panel'>
        <Automation />
      </div>
      <div className='right-panel'>
        <Spotify />
      </div>
      {toggleScreenSaver === true ? <div className='screen-saver' onClick={() => resetScrennsaver()}></div> : null}   
    </div>
  );
}
 
function useInterval(callback, delay) {
  const savedCallback = useRef();
 
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}