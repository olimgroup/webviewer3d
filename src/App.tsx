import React, { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './data';
import { setColor } from './data/color';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const color = useSelector((state: RootState) => state.color.color);
  const dispatch = useDispatch();
  // sample
  setInterval(()=>{
    console.log("?");
    dispatch(setColor(color + "a"));
  }, 1000);

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