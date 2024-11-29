import logo from './logo.svg';
import './App.css';
import AudioRecorder from './AudioRecorder';
import ManualRecording from './ManualRecording';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      
     
          {/* <AudioRecorder/> */}
          <ManualRecording/>
     
      </header>
    </div>
  );
}

export default App;
