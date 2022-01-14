/// <reference types="react-scripts" />
interface Window {
    /**
     * Used by PlayCanvas glTF parser.
     */
    DracoDecoderModule: any;
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