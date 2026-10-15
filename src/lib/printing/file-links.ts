import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
const developmentKey=randomBytes(32).toString("hex");
function key(){const secret=process.env.USER_JWT_SECRET||process.env.ADMIN_JWT_SECRET;if(secret)return secret;if(process.env.NODE_ENV==="production")throw new Error("Private file signing requires USER_JWT_SECRET or ADMIN_JWT_SECRET.");return developmentKey;}
export function signFile(id:string,actor:string,expires:number):string {return createHmac("sha256",key()).update(`${id}:${actor}:${expires}`).digest("hex");}
export function verifyFile(id:string,actor:string,expires:number,signature:string):boolean {
  if(!Number.isSafeInteger(expires)||expires<Date.now()||expires>Date.now()+6*60000||!/^[a-f0-9]{64}$/.test(signature))return false;
  const expected=Buffer.from(signFile(id,actor,expires),"hex");const actual=Buffer.from(signature,"hex");return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
