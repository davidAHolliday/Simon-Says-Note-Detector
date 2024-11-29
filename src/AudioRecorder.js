import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import Pitchfinder from 'pitchfinder';
import SpeechRecognition from 'react-speech-recognition';

const AudioRecorder = () => {
    const [audioBlob, setAudioBlob] = useState(null);
    const [detectedNotes, setDetectedNotes] = useState([]);
    const [currNote, setCurrNote] = useState(null);
    const mediaRecorderRef = useRef(null); // Ref to store the MediaRecorder instance
  

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
  [assignedNotes[0]]: "1",
  [assignedNotes[1]]: "2",
  [assignedNotes[2]]: "3",
  [assignedNotes[3]]: "4",
  [assignedNotes[4]]: "5",
  [assignedNotes[5]]: "6",
  [assignedNotes[6]]: "7",
  [assignedNotes[7]]: "8",
  [assignedNotes[8]]: "9",
 }

    const speakNumbers = (numList)=>{

        //Convert to Number
        const numbers = numList.map(note => notesToNumber[note] || 'unknown');

        const utterance = new SpeechSynthesisUtterance();
        utterance.text = numbers.join(", "); 
        window.speechSynthesis.speak(utterance);
    }

  
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

    const handleFileUpload = async (event) => {
      const file = event.target.files[0]; // Get the uploaded file
      if (!file) return;
    
      // Convert the file to a Blob and process it
      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);
      await processAudio(blob);
    };

    const uploadAudio = async () => {
      // Request access to the microphone
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
   
    const processAudio = async (blob) => {
      const audioBuffer = await blob.arrayBuffer();
      const decodedData = await Tone.getContext().decodeAudioData(audioBuffer);
  
      const pitchDetector = Pitchfinder.AMDF(); // Using the YIN algorithm
      const float32Array = decodedData.getChannelData(0); // Use the first channel
  
      const detectedFrequencies = [];
      const chunkSize = 5120; // Increased chunk size for better accuracy
      for (let i = 0; i < float32Array.length; i += chunkSize) {
        const slice = float32Array.slice(i, i + chunkSize);
        const frequency = pitchDetector(slice);
        console.log(frequency,"chunk: ",i)

        // Filter out frequencies outside the valid range
        if (frequency && frequency > 20 && frequency < 5000) {


          detectedFrequencies.push(frequency);
        } else {
          detectedFrequencies.push(null); // Represent silence as null
        }
      }

      console.log(detectedFrequencies)
  
      // Convert frequencies to musical notes
      const notes = detectedFrequencies.map((freq) => {
        if (!freq) return null; // Handle undefined frequencies

        if(freq === 918.75){
          return 'A5'
        }
  
        const noteNumber = 12 * Math.log2(freq / 440) + 69; // Exact MIDI note number
        const adjustedNoteNumber = noteNumber ; // Adjust backward by half-step
        const roundedNoteNumber = Math.round(adjustedNoteNumber);  
        // Use Tone.js to map the MIDI note to a note name
     
          return Tone.Frequency(roundedNoteNumber, 'midi').toNote();
        
      });
  
      // Filter out nulls and segment notes by silence
      const uniqueNotes = [];
      const silenceThreshold = 1; // Number of consecutive silent chunks to mark a new note
      let silenceCount = 0;
      let lastNote = null;
  
      let lastDetected = null;
      const debounceTime = 200; // Milliseconds to wait before recognizing a new note
      let noteOccurrence = {}; // Track the occurrence of each note

      notes.forEach((note) => {
        if (!note) {
          silenceCount++;
        } else {
          // Track the duration of each note
          if (!noteOccurrence[note]) {
            noteOccurrence[note] = 1;
          } else {
            noteOccurrence[note]++;
          }
    
          // If a note has only occurred once or for a very short duration, treat it as an artifact
          // if (noteOccurrence[note] <= 1) {
          //   return; // Skip this note as an artifact
          // }
    
          // Handle note detection with silence threshold and debounce
          if (silenceCount >= silenceThreshold ) {
            if (lastDetected !== note) {
              setTimeout(() => {
                uniqueNotes.push(note);
                lastDetected = note; // Update the last detected note
              }, debounceTime); // Delay to avoid detecting rapid changes
            }
            lastNote = note;
          }
          silenceCount = 0;
        }
      });
  
      setDetectedNotes(uniqueNotes);
    };
  
    return (
      <div>
        <h1>Pitch Detection App</h1>
        <div>
    {/* Button to record audio */}
    <button onClick={uploadAudio}>Upload Audio</button>

    {/* File input for uploading audio files */}
    <input
      type="file"
      accept="audio/*"
      onChange={handleFileUpload}
    />

    {/* Display the audio blob if available */}
    {audioBlob && (
      <audio controls>
        <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
        Your browser does not support the audio tag.
      </audio>
    )}
  </div>
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