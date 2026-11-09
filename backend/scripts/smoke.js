// Non-destructive API smoke tests. Run after backend is started and npm run seed has completed.
import 'dotenv/config';
const demoPassword=process.env.DEMO_PASSWORD;
if(!demoPassword){console.error('Missing DEMO_PASSWORD in backend/.env.');process.exit(1);}
const base=process.env.API_URL||'http://localhost:5000/api';
let count=0;async function check(name,fn){try{await fn();console.log(`PASS ${name}`);count++;}catch(e){console.error(`FAIL ${name}: ${e.message}`);process.exitCode=1;}}
async function request(path,opts={}){const r=await fetch(base+path,opts);const body=await r.json().catch(()=>({}));return{status:r.status,body};}
function expect(ok,message){if(!ok)throw new Error(message);}
let adminToken,memberToken,firstBook;
await check('API health',async()=>{const r=await request('/health');expect(r.status===200&&r.body.ok,'API not healthy');});
await check('Public catalogue',async()=>{const r=await request('/books?limit=5');expect(r.status===200&&Array.isArray(r.body.items),'Catalogue request failed');expect(r.body.items.length>0,'Seed data missing');firstBook=r.body.items[0];});
await check('Admin login',async()=>{const r=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@pustakaalay.demo',password:demoPassword})});expect(r.status===200&&r.body.token,'Admin login failed');adminToken=r.body.token;});
await check('Member login',async()=>{const r=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'member@pustakaalay.demo',password:demoPassword})});expect(r.status===200&&r.body.token,'Member login failed');memberToken=r.body.token;});
await check('Unauthorized write blocked',async()=>{const r=await request('/books',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});expect(r.status===401,`Expected 401, got ${r.status}`);});
await check('Member cannot create books',async()=>{const r=await request('/books',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${memberToken}`},body:'{}'});expect(r.status===403,`Expected 403, got ${r.status}`);});
await check('Dashboard stats',async()=>{const r=await request('/reports/dashboard',{headers:{Authorization:`Bearer ${adminToken}`}});expect(r.status===200&&typeof r.body.totalTitles==='number','Dashboard failed');});
await check('Member loans',async()=>{const r=await request('/transactions/my',{headers:{Authorization:`Bearer ${memberToken}`}});expect(r.status===200&&Array.isArray(r.body.items),'Member loans failed');});
await check('Book detail',async()=>{const r=await request(`/books/${firstBook._id}`);expect(r.status===200&&r.body.book?.title,'Book detail failed');});
await check('CSV report',async()=>{const r=await fetch(base+'/reports/overdue?format=csv',{headers:{Authorization:`Bearer ${adminToken}`}});expect(r.status===200&&r.headers.get('content-type')?.includes('csv'),'CSV report failed');});
console.log(`\n${count}/10 smoke checks passed.`);
