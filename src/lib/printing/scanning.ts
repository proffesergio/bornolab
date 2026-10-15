export interface ArtworkScanner {
  scan(input:{bytes:Uint8Array;mime:string;name:string}):Promise<{state:"clean"|"rejected"|"unscanned";reference:string;reason:string}>;
}
/** Demo upload boundary only. A real scan adapter must fail closed before enabling live uploads. */
export const demoScanner:ArtworkScanner={async scan(){return {state:"unscanned",reference:"demo-no-antivirus",reason:"Demo upload needs human review. No malware scan provider is connected."};}};
