/// <reference types="react-scripts" />

interface IViewer {
    initiated: boolean;
}
  
interface Window {
    viewer?: IViewer;
}

declare namespace pc {
    interface ContainerResource {
        constructor(data: any);
        scene: pc.Entity | null;
        scenes: pc.Entity[];
        cameras: pc.CameraComponent[];
        lights: pc.LightComponent[];
        nodes: pc.Entity[];
        animationIndicesByNode: number[][];
        animations: pc.Asset[];
        textures: pc.Asset[];
        materials: pc.Asset[];
        models: pc.Asset[];
        registry: pc.AssetRegistry;
    }
}