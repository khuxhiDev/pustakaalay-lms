export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const fail=(status,message)=>{throw new HttpError(status,message);};
export const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export const daysFrom=(date,n)=>new Date(new Date(date).getTime()+n*86400000);
export function fineFor(dueDate,returnedAt,rate){
  const diff=new Date(returnedAt).getTime()-new Date(dueDate).getTime();
  return Math.max(0,Math.ceil(diff/86400000))*Number(rate);
}
export function validObjectId(v){return /^[0-9a-fA-F]{24}$/.test(String(v));}
export function pagination(req){const page=Math.max(1,Number.parseInt(req.query.page)||1);const limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit)||12));return{page,limit,skip:(page-1)*limit};}
export function safeUser(u){return{id:u._id,name:u.name,email:u.email,role:u.role,memberId:u.memberId,phone:u.phone,isActive:u.isActive};}
export const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const digits=(v,min,max)=>Number.isInteger(Number(v))&&Number(v)>=min&&Number(v)<=max;
