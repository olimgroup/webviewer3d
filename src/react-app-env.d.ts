/// <reference types="react-scripts" />

interface IViewer {
    initiated: boolean;
}
  
interface Window {
    viewer?: IViewer;
}

declare namespace pc {
    interface ScriptComponent {
        create<T extends typeof ScriptType>(
          nameOrType: T,
          args?: {
            enabled?: boolean;
            attributes?: any;
            preloading?: boolean;
            ind?: number;
          },
        ): InstanceType<T>;
      }
}