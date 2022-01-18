import React, { useRef, useEffect } from 'react';
import { PlayCanvasViewer } from './playcanvas/playCanvasViewer';
import { SketchPicker } from "react-color";

class ColorPalette extends React.Component {
  state = {
    background: '#fff',
  };

  handleChangeComplete = (color:any) => {
    this.setState({ background: color.hex });
  };

  render() {
    return (
      <SketchPicker
        color={ this.state.background }
        onChangeComplete={ this.handleChangeComplete }
      />
    );
  }

}

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
      <ColorPalette />
    </div>
    
  );
}

export default App;