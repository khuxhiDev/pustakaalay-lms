import cron from 'node-cron';
import {Loan,Settings,Reservation} from '../models/index.js';
import {notify,email} from '../utils/notify.js';
import {expireReservations,offerNextReservation} from '../utils/reservations.js';
export async function runReminders(){
  const expiredBookIds=await Reservation.distinct('book',{status:'available',expiresAt:{$lte:new Date()}});
  await expireReservations();
  for(const bookId of expiredBookIds)await offerNextReservation(bookId);
  const settings=await Settings.findOne();
  const now=new Date(); const today=now.toISOString().slice(0,10);
  const loans=await Loan.find({status:{$in:['issued','overdue']}}).populate('book','title').populate('member','name email');
  for(const loan of loans){
    const daysLeft=Math.ceil((loan.dueDate-now)/86400000);
    if(daysLeft>2)continue;
    const overdue=daysLeft<0;
    if(overdue&&loan.status==='issued'){loan.status='overdue';await loan.save();}
    const title=overdue?'Overdue book reminder':'Book due soon';
    const message=`${loan.book?.title||'A book'} ${overdue?'is overdue':'is due soon'} (due ${loan.dueDate.toLocaleDateString('en-IN')}).${overdue&&settings?` Fine rate: ₹${settings.finePerDay}/day.`:''}`;
    await notify(loan.member?._id,title,message,{type:overdue?'warning':'info',dedupeKey:`reminder-${loan._id}-${today}`});
    if(loan.member?.email)await email(loan.member.email,title,message);
  }
}
export function startReminders(){cron.schedule('0 9 * * *',()=>runReminders().catch(e=>console.error('Reminders:',e.message)));}
