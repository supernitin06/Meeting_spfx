import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import { LogLevel, PnPLogging } from "@pnp/logging";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";

let _sp: SPFI | undefined = undefined;

export function getSP(context: WebPartContext | undefined = undefined): SPFI {
    if (!_sp && context) {
        _sp = spfi().using(SPFx(context)).using(PnPLogging(LogLevel.Warning));
    }
    return _sp as SPFI;
}

