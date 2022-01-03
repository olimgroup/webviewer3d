import React, { useRef, useEffect, useCallback, useState } from 'react';
import { observer } from "mobx-react-lite";
import { PlayCanvasViewer } from './playcanvas/PlayCanvasViewer';

export const useLoadingState = (): [boolean, () => void, () => void] => {
    const [loadingCount, setLoadingCount] = useState(0);
    const onHandleIncrement = useCallback(() => setLoadingCount(c => c + 1), []);
    const onHandleDecrement = useCallback(() => setLoadingCount(c => c - 1), []);
    return [loadingCount > 0, onHandleIncrement, onHandleDecrement];
};

export const useAsyncWithLoadingAndErrorHandling = (): [boolean, boolean, (fn: () => Promise<void>) => void] => {
    const [isLoading, startLoadingTask, endLoadingTask] = useLoadingState();
    const [isError, setIsError] = useState(false);
    const runAsync = useCallback(
        async (callback: () => Promise<void>) => {
            setIsError(false);
            startLoadingTask();
            try {
              await callback();
            } catch (error) {
              setIsError(true);
              endLoadingTask();
              throw error;
            }
            endLoadingTask();
        },
        [startLoadingTask, endLoadingTask, setIsError],
    );
    return [isLoading, isError, runAsync];
};

export type ViewerProps = {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
};
export const App =  observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [
    localIsLoading,
    hasLoadError,
    runAsync,
  ] = useAsyncWithLoadingAndErrorHandling();

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const viewer = new PlayCanvasViewer(canvasRef.current);
    viewer.Initialize();
    runAsync(async () => {
      await viewer.loadGltf("../../assets/couch/couch.gltf", "couch.gltf");
    });
  }, []);
  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
});