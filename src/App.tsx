import { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';
import WebcamContainer from './components/webcam/webcamContainer';
import ColorPalette from './components/ColorPalette';

function App() {
  const viewer = new PlayCanvasViewer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    if (!inputRef.current) {
      return;
    }

    viewer.initialize(canvasRef.current);
    viewer.setInputElement(inputRef.current);

    viewer.loadGltf("../../assets/ZE152_01_A2/ZE152_01_A2.gltf", "ZE152_01_A2.gltf");
    
  }, []);

  return (
    <div>
      <WebcamContainer></WebcamContainer>
      <canvas ref={canvasRef} />
      <div>
        <input ref={inputRef} type="text" />
      </div>
      <ColorPalette viewer={viewer}/>
    </div>    
  );
}

export default App;