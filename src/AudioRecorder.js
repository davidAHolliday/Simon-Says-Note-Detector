import React, { useState } from 'react';
import * as Tone from 'tone';
import Pitchfinder from 'pitchfinder';

const AudioRecorder = () => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [detectedNotes, setDetectedNotes] = useState([]);

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
    setTimeout(() => mediaRecorder.stop(), 3000); // Stop after 3 seconds
  };

  const processAudio = async (blob) => {
    const audioBuffer = await blob.arrayBuffer();
    const decodedData = await Tone.getContext().decodeAudioData(audioBuffer);

    const pitchDetector = Pitchfinder.YIN(); // Using the YIN algorithm
    const float32Array = decodedData.getChannelData(0); // Use the first channel

    const detectedFrequencies = [];
    for (let i = 0; i < float32Array.length; i += 1024) {
      const slice = float32Array.slice(i, i + 1024);
      const frequency = pitchDetector(slice);
      if (frequency) detectedFrequencies.push(frequency);
    }

    const notes = detectedFrequencies.map((freq) => {
      const noteNumber = Math.round(12 * Math.log2(freq / 440) + 69);
      return Tone.Frequency(noteNumber, 'midi').toNote();
    });

    setDetectedNotes(notes);
  };

  return (
    <div>
      <h1>Pitch Detection App</h1>
      <button onClick={recordAudio}>Record Audio</button>
      {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
      <div>
        <h2>Detected Notes:</h2>
        <p>{detectedNotes.join(', ')}</p>
      </div>
    </div>
  );
};
export default AudioRecorder;
