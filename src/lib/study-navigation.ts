import { STUDY_CATEGORIES, type StudyCategory, type StudyMaterial, isBuetOnlyMaterial } from "./study-data";
import { PLATFORM_SUBJECTS } from "./study-platform/curriculum";
export type StudyGoal = {id:string;title:string;titleBn:string;description:string;enabled:boolean;categories:StudyCategory[];department:string;subjectIds:string[];questionBankDepartment:string};
export type StudySubject = {id:string;title:string;titleBn:string;enabled:boolean};
export type StudyNavigation = {goals:StudyGoal[];subjects:StudySubject[];chapterOverrides:Record<string,{title:string;enabled:boolean}>;showResources:boolean;showQuestions:boolean;showPractice:boolean};
export const DEFAULT_STUDY_NAVIGATION:StudyNavigation = {
  goals:[{id:"it-jobs",title:"IT jobs & competitive exams",titleBn:"আইটি চাকরি ও প্রতিযোগিতামূলক পরীক্ষা",description:"Prepare with subject notes, solved questions, practice and timed exams.",enabled:true,categories:[],department:"",subjectIds:PLATFORM_SUBJECTS.map(s=>s.id),questionBankDepartment:""},...STUDY_CATEGORIES.map(c=>({id:c.id,title:c.label,titleBn:c.bangla,description:c.desc,enabled:true,categories:[c.id],department:c.id==="masters"?"buet-pg":"",subjectIds:c.id==="masters"?PLATFORM_SUBJECTS.map(s=>s.id):[],questionBankDepartment:""}))],
  subjects:PLATFORM_SUBJECTS.map(s=>({id:s.id,title:s.title.en,titleBn:s.title.bn,enabled:true})),chapterOverrides:{},showResources:true,showQuestions:true,showPractice:true,
};
export function validateStudyNavigation(value:unknown):StudyNavigation {
  if(!value||typeof value!=="object")throw new Error("Learning organization is required.");
  const nav=value as StudyNavigation;
  function string(v:unknown,max=300){if(typeof v!=="string"||v.length>max)throw new Error("Invalid learning text.");return v.trim();}
  function bool(v:unknown){if(typeof v!=="boolean")throw new Error("Invalid visibility.");}
  if(!Array.isArray(nav.goals)||!Array.isArray(nav.subjects)||nav.goals.length>60||nav.subjects.length>100)throw new Error("Invalid learning goals or subjects.");
  const subjects=new Set<string>();for(const s of nav.subjects){if(!/^[a-z0-9-]+$/.test(string(s.id,100))||subjects.has(s.id)||!string(s.title,160))throw new Error("Subjects need unique IDs and a title.");subjects.add(s.id);string(s.titleBn,160);bool(s.enabled);}
  const goals=new Set<string>();for(const g of nav.goals){if(!/^[a-z0-9-]+$/.test(string(g.id,100))||goals.has(g.id)||!string(g.title,160))throw new Error("Goals need unique IDs and a title.");goals.add(g.id);string(g.titleBn,160);string(g.description,1000);bool(g.enabled);string(g.department,100);string(g.questionBankDepartment,100);if(!Array.isArray(g.subjectIds)||g.subjectIds.length>100||g.subjectIds.some(id=>!subjects.has(id)))throw new Error("Choose existing subjects for each goal.");if(!Array.isArray(g.categories)||g.categories.some(c=>!STUDY_CATEGORIES.some(v=>v.id===c)))throw new Error("Choose valid resource categories.");}
  bool(nav.showResources);bool(nav.showQuestions);bool(nav.showPractice);
  if(!nav.chapterOverrides||typeof nav.chapterOverrides!=="object"||Array.isArray(nav.chapterOverrides)||Object.keys(nav.chapterOverrides).length>1000)throw new Error("Invalid chapter settings.");
  for(const [id,v] of Object.entries(nav.chapterOverrides)){if(!/^[a-z0-9-]+$/.test(id)||!v||typeof v!=="object")throw new Error("Invalid chapter.");string(v.title,200);bool(v.enabled);}
  return structuredClone(nav);
}
export function goalMaterials(materials:StudyMaterial[],goal:StudyGoal|undefined) {
  return materials.filter(m=>goal?((!goal.categories.length?(!isBuetOnlyMaterial(m)) : goal.categories.includes(m.category))&&(!goal.department||m.department===goal.department)&&(!isBuetOnlyMaterial(m)||goal.categories.includes("masters"))):!isBuetOnlyMaterial(m));
}
export function resolveStudyPath<T extends {id:string;subjectId:string}>(navigation:StudyNavigation,goalId:string|null,subjectId:string|null,allChapters:T[]) {
  const goals=navigation.goals.filter(g=>g.enabled),goal=goals.find(g=>g.id===goalId);
  const subjects=navigation.subjects.filter(s=>s.enabled&&goal?.subjectIds.includes(s.id)),subject=subjects.find(s=>s.id===subjectId);
  return {goals,goal,subjects,subject,chapters:allChapters.filter(c=>c.subjectId===subject?.id&&navigation.chapterOverrides[c.id]?.enabled!==false)};
}
