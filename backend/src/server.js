import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import {connectDB} from './config/db.js';
import routes from './routes/index.js';
import {startReminders} from './jobs/reminders.js';
const app=express();
app.disable('x-powered-by');app.use(helmet());
app.use(cors({origin:(origin,callback)=>{const allowed=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(x=>x.trim());callback(null,!origin||allowed.includes(origin));}}));
app.use(express.json({limit:'100kb'}));app.use(morgan('dev'));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:60,standardHeaders:'draft-7',legacyHeaders:false,message:{message:'Too many requests. Try again later.'}}));
app.get('/api/health',(_req,res)=>res.json({ok:true,app:'Pustakaalay LMS',time:new Date().toISOString()}));
app.use('/api',routes);
app.use((_req,res)=>res.status(404).json({message:'Endpoint not found'}));
app.use((err,_req,res,_next)=>{
  if(err.message==='ROLE_FORBIDDEN')return res.status(403).json({message:'You do not have permission to perform this action.'});
  if(err.code===11000)return res.status(409).json({message:`Duplicate value for ${Object.keys(err.keyPattern||{})[0]||'unique field'}.`});
  if(err.name==='ValidationError')return res.status(400).json({message:Object.values(err.errors).map(e=>e.message).join('. ')});
  if(err.name==='CastError')return res.status(400).json({message:'Invalid record ID.'});
  if(err.type==='entity.parse.failed')return res.status(400).json({message:'Invalid JSON payload.'});
  if(!err.status)console.error(err.stack);
  res.status(err.status||500).json({message:err.status?err.message:'Unexpected server error. Please try again.'});
});
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('Set a unique JWT_SECRET with at least 32 characters in backend/.env');process.exit(1);}
try{await connectDB();startReminders();app.listen(process.env.PORT||5000,()=>console.log(`API listening at http://localhost:${process.env.PORT||5000}`));}
catch(e){console.error('Startup failed:',e.message);process.exit(1);}
