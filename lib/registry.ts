import {
    TargetClassDescriptor,
    TargetEnumDescriptor,
    TargetStructDescriptor,
} from "../abi/metadata";
import { ContextDescriptorKind } from "../abi/metadatavalues";
import { getAllFullTypeData, getAllProtocolDescriptors } from "./macho";
import { Class, Enum, Protocol, Struct, Type } from "./types";

export type TypeMap = Record<string, Type>;
export type ClassMap = Record<string, Class>;
export type StructMap = Record<string, Struct>;
export type EnumMap = Record<string, Enum>;
export type ProtocolMap = Record<string, Protocol>;

export class Registry {
    private static sharedInstance: Registry;

    readonly modules: Record<string, SwiftModule> = {};
    readonly classes: ClassMap = {};
    readonly structs: StructMap = {};
    readonly enums: EnumMap = {};
    readonly protocols: ProtocolMap = {};
    readonly cachedTypes: TypeMap = {};

    static shared(): Registry {
        if (Registry.sharedInstance === undefined) {
            Registry.sharedInstance = new Registry();
        }

        return Registry.sharedInstance;
    }

    private constructor() {
        for (const fullTypeData of getAllFullTypeData()) {
            const descriptor = fullTypeData.descriptor;
            const conformances = fullTypeData.conformances;

            switch (fullTypeData.descriptor.getKind()) {
                case ContextDescriptorKind.Class: {
                    const klass = new Class(
                        descriptor as TargetClassDescriptor,
                        conformances
                    );
                    this.classes[klass.$name] = klass;
                    this.classes[descriptor.getFullTypeName()] = klass;
                    this.getModule(klass.$moduleName).addClass(klass);
                    break;
                }
                case ContextDescriptorKind.Struct: {
                    const struct = new Struct(
                        descriptor as TargetStructDescriptor,
                        conformances
                    );
                    this.structs[struct.$name] = struct;
                    this.structs[descriptor.getFullTypeName()] = struct;
                    this.getModule(struct.$moduleName).addStruct(struct);
                    break;
                }
                case ContextDescriptorKind.Enum: {
                    const anEnum = new Enum(
                        descriptor as TargetEnumDescriptor,
                        conformances
                    );
                    this.enums[anEnum.$name] = anEnum;
                    this.enums[descriptor.getFullTypeName()] = anEnum;
                    this.getModule(anEnum.$moduleName).addEnum(anEnum);
                    break;
                }
            }
        }

        for (const protoDesc of getAllProtocolDescriptors()) {
            const proto = new Protocol(protoDesc);
            this.protocols[protoDesc.name] = proto;
            this.protocols[protoDesc.getFullProtocolName()] = proto;
            this.getModule(proto.moduleName).addProtocol(proto);
        }
    }

    private getModule(name: string) {
        if (name in this.modules) {
            return this.modules[name];
        }

        const module = new SwiftModule(name);
        this.modules[name] = module;
        return module;
    }
}

export class SwiftModule {
    readonly classes: ClassMap = {};
    readonly structs: StructMap = {};
    readonly enums: EnumMap = {};
    readonly protocols: ProtocolMap = {};

    constructor(readonly name: string) {}

    addClass(klass: Class): void {
        this.classes[klass.$name] = klass;
        this.classes[klass.descriptor.getFullTypeName(false)] = klass;
    }

    addStruct(struct: Struct): void {
        this.structs[struct.$name] = struct;
        this.structs[struct.descriptor.getFullTypeName(false)] = struct;
    }

    addEnum(anEnum: Enum): void {
        this.enums[anEnum.$name] = anEnum;
        this.enums[anEnum.descriptor.getFullTypeName(false)] = anEnum;
    }

    addProtocol(protocol: Protocol): void {
        this.protocols[protocol.name] = protocol;
        this.protocols[protocol.descriptor.getFullProtocolName(false)] = protocol;
    }

    toJSON(): Record<string, number> {
        return {
            classes: Object.keys(this.classes).length,
            structs: Object.keys(this.structs).length,
            enums: Object.keys(this.enums).length,
            protocols: Object.keys(this.protocols).length,
        };
    }
}
