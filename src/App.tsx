import { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';
import ColorPalette from './components/ColorPalette';

function App() {
  const viewer = new PlayCanvasViewer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    viewer.Initialize(canvasRef.current);
    viewer.loadGltf("../../assets/couch/couch.gltf", "couch.gltf");    
  }, []); 
  
  return (
    <div>
      <canvas ref={canvasRef} />
      <ColorPalette viewer={viewer}/>
    </div>    
  );
}

export default App;