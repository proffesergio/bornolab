import {isDbConfigured,kvGet,kvMutate} from "./db";
import {readJson,writeJson} from "./store";
import {DEFAULT_STUDY_NAVIGATION,type StudyNavigation} from "./study-navigation";
type Record = {navigation:StudyNavigation;version:number;audit:{actor:string;at:number}[]};
const fallback=():Record=>({navigation:structuredClone(DEFAULT_STUDY_NAVIGATION),version:0,audit:[]});
let queue:Promise<unknown>=Promise.resolve();
export async function readStudyNavigation():Promise<Record> {
  if(isDbConfigured())return (await kvGet("study:navigation") as Record|undefined)??fallback();
  if(process.env.NODE_ENV==="production")throw new Error("Learning storage requires PostgreSQL.");
  return readJson("study-navigation.json",fallback());
}
export async function saveStudyNavigation(navigation:StudyNavigation,version:number,actor:string):Promise<Record> {
  const update=(record:Record)=>{if(record.version!==version)throw new Error("Learning settings changed in another session. Reload before saving.");record.navigation=navigation;record.version++;record.audit=[...record.audit,{actor,at:Date.now()}].slice(-200);return record;};
  if(isDbConfigured())return kvMutate("study:navigation",fallback(),update);
  if(process.env.NODE_ENV==="production")throw new Error("Learning storage requires PostgreSQL.");
  const operation=queue.then(async()=>{const record=update(await readStudyNavigation());await writeJson("study-navigation.json",record);return record;});queue=operation.catch(()=>undefined);return operation;
}
