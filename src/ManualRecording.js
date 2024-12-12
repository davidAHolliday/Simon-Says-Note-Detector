import React, { useState, useEffect } from 'react';
import './poc.css';
import Timer from './timer';

const ManualRecording = () => {
  const [detectedNotes, setDetectedNotes] = useState([]);
  const [currNote, setCurrNote] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isClear, setIsClear] = useState(false);

  useEffect(() => {
    console.log(detectedNotes.length);
    if (detectedNotes.length > 0) {
      setIsRunning(true);
    }
  }, [detectedNotes]);

  const colors = [
    'purple', 'blue', '#CC5500',
    'yellow', 'green', 'cyan',
    'grey', 'pink', 'darkblue',
  ];

  const notesToNumber = {
    '00': "1",
    '10': "2",
    '20': "3",
    '01': "4",
    '11': "5",
    '21': "6",
    '02': "7",
    '12': "8",
    '22': "9",
   }

  const speakNumbers = (numList, pauseDuration = 700) => {
    // Convert to numbers and speak each
    const numbers = numList.map((note) => note || 'unknown');
    numbers.forEach((number, index) => {
      const utterance = new SpeechSynthesisUtterance(number.toString());
      setCurrNote(number);
      window.speechSynthesis.speak(utterance);

      if (index < numbers.length - 1) {
        const pause = new SpeechSynthesisUtterance('');
        pause.volume = 0;
        setTimeout(() => window.speechSynthesis.speak(pause), pauseDuration * index);
      }
    });
  };

  const playbackPattern = () => {
    if (!detectedNotes || detectedNotes.length === 0) return;

    speakNumbers(detectedNotes);

    detectedNotes.forEach((note, index) => {
      setTimeout(() => {
        setCurrNote(note);
      }, index * 1000);
    });

    setTimeout(() => setCurrNote(null), detectedNotes.length * 1000);
  };

  const addNote = (col, row) => {
    const note = `${col}${row}`;
    const numbers = notesToNumber[note];
    setDetectedNotes((prev) => [...prev, numbers]);
    setCurrNote(note);
  };

  function getRowColor(rowIndex) {
    const colors = ["red", "blue", "green", "purple", "orange"]; // Add as many colors as needed
    return colors[rowIndex % colors.length]; // Cycle through colors
  }
  

  return (
    <div>
      <h1>Pattern Repetition Playback App</h1>
      <Timer isRunning={isRunning} isClear={isClear} setIsClear={setIsClear} />
      <div>
  <button onClick={playbackPattern}>Play Pattern</button>
  <h2>Detected Notes:</h2>
  <div>
    {detectedNotes.reduce((rows, note, index) => {
      const rowIndex = Math.floor(index / 4); // Determine the row number
      if (!rows[rowIndex]) rows[rowIndex] = []; // Initialize a new row if needed
      rows[rowIndex].push(note);
      return rows;
    }, []).map((row, rowIndex) => (
      <p key={rowIndex} style={{ color: getRowColor(rowIndex) }}> {/* Assign row color */}
        {row.join(" ")} {/* Join notes in the row with spaces */}
      </p>
    ))}
  </div>
</div>

      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        {["row1", "row2", "row3"].map((row, rowIndex) => (
          <div key={rowIndex} className={row} style={{ display: 'flex' }}>
            {["col1", "col2", "col3"].map((col, colIndex) => {
              const squareIndex = rowIndex * 3 + colIndex;
              return (
                <div
                  className="square"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor:colors[squareIndex],
                    margin: "5px",
                    border: currNote === `${colIndex}${rowIndex}`? "3px solid red":"1px solid black",
                  }}
                  onClick={() => addNote(colIndex, rowIndex)}
                  key={`${colIndex}-${rowIndex}`}
                ></div>
              );
            })}
          </div>
        ))}
        <div className="erase" onClick={() => setDetectedNotes((prev) => prev.slice(0, -1))}>Erase</div>
      </div>
      <button onClick={() => setIsRunning(false)}>Stop Timer</button>
      <button
        onClick={() => {
          setIsRunning(false);
          setDetectedNotes([]);
          setCurrNote(null);
          setIsClear(true);
          setTimeout(() => setIsClear(false), 0); // Reset isClear for future use
        }}
      >
        Clear
      </button>
    </div>
  );
};

export default ManualRecording;
