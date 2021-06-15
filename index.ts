import { getApi, API } from "./lib/api";
import { getSwift5Types, SwiftType } from "./lib/types";
import { enumerateDemangledSymbols } from "./lib/symbols";

class Runtime {
    #api: API = null;
    #apiError: Error = null;

    constructor() {
        this.tryInitialize();
    }

    get available(): boolean {
        return this.tryInitialize();
    }

    get api(): API {
        return getApi();
    }

    enumerateTypes(module: Module): SwiftType[] {
        const types: SwiftType[] = [];

        if (module === undefined) {
            const allModules = new ModuleMap();
            for (const m of allModules.values()) {
                types.push(...getSwift5Types(m));
            }
        } else {
            types.push(...getSwift5Types(module));
        }

        return types;
    }

    enumerateDemangledSymbols(module: Module): ModuleSymbolDetails[] {
        return enumerateDemangledSymbols(module);
    }

    private tryInitialize(): boolean {
        if (this.#api !== null) {
            return true;
        }

        if (this.#apiError !== null) {
            throw this.#apiError;
        }
    }
}

export const Swift = new Runtime();