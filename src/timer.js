import React, { useState, useEffect } from 'react';

const Timer = ({ isRunning, isClear, setIsClear }) => {
  const [elapsedTime, setElapsedTime] = useState(0); // Track elapsed time in seconds

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      const startTime = Date.now() - elapsedTime * 1000; // Account for previously elapsed time
      interval = setInterval(() => {
        const currentTime = Date.now();
        setElapsedTime(Math.floor((currentTime - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, elapsedTime]); // Re-run effect when `isRunning` or `elapsedTime` changes



  useEffect(()=>{
    if(isClear){
        setElapsedTime(0)
        setIsClear(false)

    }

  },[isClear])

  // Calculate days, hours, minutes, and seconds from elapsed time
  const days = Math.floor(elapsedTime / (24 * 60 * 60));
  const hours = Math.floor((elapsedTime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((elapsedTime % (60 * 60)) / 60);
  const seconds = elapsedTime % 60;

  return (
    <div className="timer">
      <h2>Timer</h2>
      <p>
        {days} Days : {hours} Hours : {minutes} Minutes : {seconds} Seconds
      </p>
    </div>
  );
};

export default Timer;
