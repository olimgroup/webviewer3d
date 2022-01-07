import { useRef, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { PlayCanvasViewer } from './playcanvas/PlayCanvasViewer';

export type ViewerProps = {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
};
export const App =  observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    if (!inputRef.current) {
      return;
    }
    if (!divRef.current) {
      return ;
    }
    const viewer = new PlayCanvasViewer(divRef.current, canvasRef.current);
    viewer.Initialize();
    viewer.setInputElement(inputRef.current);
  }, []);

  return (
    <div ref={divRef}>
      <div>
        <canvas ref={canvasRef} />      
      </div>
      <div>
        <input ref={inputRef} type="text" />
      </div>
    </div>
  );
});