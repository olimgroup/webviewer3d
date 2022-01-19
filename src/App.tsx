import React, { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';
import WebcamContainer from './components/webcam/webcamContainer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const viewer = new PlayCanvasViewer(canvasRef.current);
    viewer.Initialize();
    viewer.loadGltf("../../assets/couch/couch.gltf", "couch.gltf");
    
    //const webcam = new WebcamContainer();
  }, []);

  return (
    <div>
      <WebcamContainer></WebcamContainer>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;