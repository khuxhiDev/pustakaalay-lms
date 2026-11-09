import jwt from 'jsonwebtoken';
import {User} from '../models/index.js';
import {fail,wrap} from '../utils/helpers.js';
export const protect=wrap(async(req,_res,next)=>{
  const token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)fail(401,'Please log in to continue.');
  let payload;
  try{payload=jwt.verify(token,process.env.JWT_SECRET);}catch{fail(401,'Your session has expired. Please log in again.');}
  const user=await User.findById(payload.id);
  if(!user||!user.isActive)fail(401,'Account unavailable.');
  req.user=user;next();
});
export const allow=(...roles)=>(req,_res,next)=>roles.includes(req.user?.role)?next():next(new Error('ROLE_FORBIDDEN'));
