import React, { useRef, useState, useCallback, useEffect } from 'react';
import './App.css';
import * as pc from "playcanvas";
interface CanvasProps {
  width: number;
  height: number;
}

function App({ width, height }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  if (canvasRef.current)
  {
    const app = new pc.Application(canvasRef.current, {});
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);

        // ensure canvas is resized when window changes size
        window.addEventListener('resize', () => app.resizeCanvas());

        // create box entity
        const box = new pc.Entity('cube');
        box.addComponent('model', {
            type: 'box'
        });
        app.root.addChild(box);

        // create camera entity
        const camera = new pc.Entity('camera');
        camera.addComponent('camera', {
            clearColor: new pc.Color(0.1, 0.1, 0.1)
        });
        app.root.addChild(camera);
        camera.setPosition(0, 0, 3);

        // create directional light entity
        const light = new pc.Entity('light');
        light.addComponent('light');
        app.root.addChild(light);
        light.setEulerAngles(45, 0, 0);

        // rotate the box according to the delta time since the last frame
        app.on('update', dt => box.rotate(10 * dt, 20 * dt, 30 * dt));

        app.start();

  }
  
  return (
    <div className="App">
      <canvas ref={canvasRef} height={height} width={width} className="canvas"/>
    </div>
  );
}

App.defaultProps = {
  width: 512,
  height: 512
};

export default App;
