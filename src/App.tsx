import React, { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const viewer = new PlayCanvasViewer(canvasRef.current);
    viewer.Initialize();
    viewer.loadGltf("../../assets/couch/couch.gltf", "couch.gltf");
    
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;