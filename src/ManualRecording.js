import React, { useState, useRef, useEffect } from 'react';
import './poc.css'
const ManualRecording = () => {
    const [detectedNotes, setDetectedNotes] = useState([]);
    const [currNote, setCurrNote] = useState(null);
  

    const assignedNotes = ['B5', 'x', 'D5', 'x', 'F#5', 'G5', 'x', '', 'C#5'];

    const noteToSquareMapping = {
      [assignedNotes[0]]: "row1-col1",
      [assignedNotes[1]]: "row1-col2",
      [assignedNotes[2]]: "row1-col3",
      [assignedNotes[3]]: "row2-col1",
      [assignedNotes[4]]: "row2-col2",
      [assignedNotes[5]]: "row2-col3",
      [assignedNotes[6]]: "row3-col1",
      [assignedNotes[7]]: "row3-col2",
      [assignedNotes[8]]: "row3-col3",
    };

    //Covert Notes into Numbers

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
  // Convert to Number
  const numbers = numList.map(note => notesToNumber[note] || 'unknown');

  numbers.forEach((number, index) => {
      const utterance = new SpeechSynthesisUtterance(number.toString());
      window.speechSynthesis.speak(utterance);

      // Add a silent utterance (pause) after each number
      if (index < numbers.length - 1) {
          const pause = new SpeechSynthesisUtterance('');
          pause.volume = 0; // Silent pause
          setTimeout(() => window.speechSynthesis.speak(pause), pauseDuration * index);
      }
  });
};

  
    const playbackPattern = () => {
        if (!detectedNotes || detectedNotes.length === 0) return;
        console.log(detectedNotes)

        speakNumbers(detectedNotes)
    
        detectedNotes.forEach((note, index) => {
          setTimeout(() => {
            setCurrNote(note); // Set normalized note
          }, index * 1500); // Set 1-second intervals
        });
    
        // Reset the current note after playback finishes
        setTimeout(() => setCurrNote(null), detectedNotes.length * 1000);
      };
  
   
const addNote =(col, row)  =>{
  const str1 = String(col);
  const row1 =  String(row);
  const nts = detectedNotes;
  nts.push(str1.concat(row1))
  setDetectedNotes(nts)

}
    
  
    return (
      <div>
        <h1>Pitch Detection App</h1>
        <div>
   

    {/* Display the audio blob if available */}
  
  </div>
        <button onClick={playbackPattern}>Play Pattern</button>
        <div>
          <h2>Detected Notes:</h2>
          <p>{detectedNotes.join(', ')}</p>
        </div>
        <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
          {["row1", "row2", "row3"].map((row, rowIndex) => (
            <div key={rowIndex} className={row} style={{ display: 'flex' }}>
              {["col1", "col2", "col3"].map((col, colIndex) => {
                const squareId = `${row}-${col}`;
                return (
                  <div
                  className='square'
                  onClick={()=>addNote(colIndex,rowIndex)}
                    key={colIndex}
                    style={{
                      height: 70,
                      width: 70,
                      margin: 10,
                      // backgroundColor:
                      //   currNote &&
                      //   noteToSquareMapping[currNote] === squareId
                      //     ? "yellow"
                      //     : "blue",
                    }}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default ManualRecording;