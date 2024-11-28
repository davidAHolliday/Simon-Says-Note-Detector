import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import Pitchfinder from 'pitchfinder';

const AudioRecorder = () => {
    const [audioBlob, setAudioBlob] = useState(null);
    const [detectedNotes, setDetectedNotes] = useState([]);
    const [currNote, setCurrNote] = useState(null);
    const mediaRecorderRef = useRef(null); // Ref to store the MediaRecorder instance
  
    const noteToSquareMapping = {
      "A#4": "row1-col1",
      "B5": "row1-col2",
      "C#5": "row1-col3",
      "D#5": "row2-col1",
      "E5": "row2-col2",
      "F#5": "row2-col3",
      "G#5": "row3-col1",
      "A#5": "row3-col2",
      "B6": "row3-col3",
    };


  
    const playbackPattern = () => {
        if (!detectedNotes || detectedNotes.length === 0) return;
        console.log(detectedNotes)
    
        detectedNotes.forEach((note, index) => {
          setTimeout(() => {
            setCurrNote(note); // Set normalized note
          }, index * 1500); // Set 1-second intervals
        });
    
        // Reset the current note after playback finishes
        setTimeout(() => setCurrNote(null), detectedNotes.length * 1000);
      };
  
    const recordAudio = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
  
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        processAudio(blob);
      };
  
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder; // Save MediaRecorder instance to the ref
    };
  
    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop(); // Stop recording
      }
    };
  
    const processAudio = async (blob) => {
      const audioBuffer = await blob.arrayBuffer();
      const decodedData = await Tone.getContext().decodeAudioData(audioBuffer);
  
      const pitchDetector = Pitchfinder.YIN(); // Using the YIN algorithm
      const float32Array = decodedData.getChannelData(0); // Use the first channel
  
      const detectedFrequencies = [];
      const chunkSize = 4096; // Increased chunk size for better accuracy
      for (let i = 0; i < float32Array.length; i += chunkSize) {
        const slice = float32Array.slice(i, i + chunkSize);
        const frequency = pitchDetector(slice);
        // Filter out frequencies outside the valid range
        if (frequency && frequency > 20 && frequency < 5000) {
          detectedFrequencies.push(frequency);
        } else {
          detectedFrequencies.push(null); // Represent silence as null
        }
      }
  
      // Convert frequencies to musical notes
      const notes = detectedFrequencies.map((freq) => {
        if (!freq) return null; // Handle undefined frequencies
  
        const noteNumber = 12 * Math.log2(freq / 440) + 69; // Exact MIDI note number
        const roundedNoteNumber = Math.round(noteNumber); // Round to the nearest MIDI note
  
        // Use Tone.js to map the MIDI note to a note name
        return Tone.Frequency(roundedNoteNumber, 'midi').toNote();
      });
  
      // Filter out nulls and segment notes by silence
      const uniqueNotes = [];
      const silenceThreshold = 5; // Number of consecutive silent chunks to mark a new note
      let silenceCount = 0;
      let lastNote = null;
  
      notes.forEach((note) => {
        if (!note) {
          // Increment silence count if the note is null (silence)
          silenceCount++;
        } else {
          if (silenceCount >= silenceThreshold || note !== lastNote) {
            // If there's enough silence or the note changes, treat it as a new note
            uniqueNotes.push(note);
            lastNote = note; // Update the last detected note
          }
          silenceCount = 0; // Reset silence count when a note is detected
        }
      });
  
      setDetectedNotes(uniqueNotes);
    };
  
    return (
      <div>
        <h1>Pitch Detection App</h1>
        <button onClick={recordAudio}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
        <button onClick={playbackPattern}>Play Pattern</button>
        {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
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
                    key={colIndex}
                    style={{
                      height: 30,
                      width: 30,
                      margin: 10,
                      backgroundColor:
                        currNote &&
                        noteToSquareMapping[currNote] === squareId
                          ? "yellow"
                          : "blue",
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
  
  export default AudioRecorder;