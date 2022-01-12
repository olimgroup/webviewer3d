/// <reference types="react-scripts" />


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


    // interface GlbResource {
    //     constructor(data: any);
    //     scene: pc.Entity | null;
    //     scenes: pc.Entity[];
    //     cameras: pc.CameraComponent[];
    //     lights: pc.LightComponent[];
    //     nodes: pc.Entity[];
    //     animationIndicesByNode: number[][];
    //     animations: pc.Asset[];
    //     textures: pc.Asset[];
    //     materials: pc.Asset[];
    //     models: pc.Asset[];
    //     registry: pc.AssetRegistry;
    // }
}