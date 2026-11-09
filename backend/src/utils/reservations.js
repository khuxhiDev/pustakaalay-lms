import {Reservation,User,Book} from '../models/index.js';
import {daysFrom} from './helpers.js';
import {notify,email} from './notify.js';
export async function expireReservations(){
  const expired=await Reservation.find({status:'available',expiresAt:{$lte:new Date()}});
  for(const r of expired){r.status='expired';await r.save();}
  return expired.length;
}
export async function offerNextReservation(bookId){
  await expireReservations();
  const book=await Book.findById(bookId);
  if(!book||book.availableCopies<1)return null;
  const active=await Reservation.countDocuments({book:bookId,status:'available'});
  if(active>=book.availableCopies)return null;
  // findOneAndUpdate prevents the same pending reservation from being offered twice
  const next=await Reservation.findOneAndUpdate({book:bookId,status:'pending'},{$set:{status:'available',expiresAt:daysFrom(new Date(),2)}},{new:true,sort:{reservedAt:1}});
  if(next){
    const member=await User.findById(next.member);
    await notify(next.member,'Reserved book ready',`${book.title} is ready for collection. Please collect it within 2 days.`,{type:'success'});
    if(member)await email(member.email,'Your reserved book is ready',`${book.title} is now available. Please collect it within 2 days.`);
  }
  return next;
}
