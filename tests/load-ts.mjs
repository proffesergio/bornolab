import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const require=createRequire(import.meta.url);
export function load(file,overrides={},cache=new Map()){
  const absolute=path.resolve(file);if(cache.has(absolute))return cache.get(absolute);
  const compiledModule={exports:{}};cache.set(absolute,compiledModule.exports);
  const output=ts.transpileModule(readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  function dependency(name){if(name in overrides)return overrides[name];if(name.startsWith('@/')||name.startsWith('.')){let target=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(absolute),name);if(!path.extname(target))target=existsSync(target+'.ts')?target+'.ts':target+'.tsx';return load(target,overrides,cache);}return require(name);}
  new Function('require','module','exports','process',output)(dependency,compiledModule,compiledModule.exports,overrides.__process??process);cache.set(absolute,compiledModule.exports);return compiledModule.exports;
}
