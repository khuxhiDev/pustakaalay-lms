import nodemailer from 'nodemailer';
import {Notification} from '../models/index.js';
export async function notify(user,title,message,{type='info',dedupeKey}={}){
  try{await Notification.create({user,title,message,type,...(dedupeKey?{dedupeKey}:{})});}
  catch(e){if(e.code!==11000)console.error('Notification error:',e.message);}
}
export async function email(to,subject,text){
  if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS)return false;
  try{
    const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
    await transport.sendMail({from:process.env.EMAIL_FROM||process.env.SMTP_USER,to,subject,text});return true;
  }catch(e){console.error('Email error:',e.message);return false;}
}
