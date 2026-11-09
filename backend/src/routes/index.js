import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import {User,Book,Category,Loan,Reservation,Settings,Notification} from '../models/index.js';
import {protect,allow} from '../middleware/auth.js';
import {wrap,fail,daysFrom,fineFor,validObjectId,pagination,safeUser,emailPattern,digits} from '../utils/helpers.js';
import {notify} from '../utils/notify.js';
import {expireReservations,offerNextReservation} from '../utils/reservations.js';

const r=Router();
const staff=[protect,allow('admin','librarian')];
const admin=[protect,allow('admin')];
const tokenFor=u=>jwt.sign({id:u._id.toString()},process.env.JWT_SECRET,{expiresIn:'1d'});
const getSettings=async()=>await Settings.findOne()||await Settings.create({});
const clean=s=>String(s||'').trim();
const objectId=v=>{if(!validObjectId(v))fail(400,'Invalid record ID.');return v;};
const memberOrStaff=(req,memberId)=>req.user.role!=='member'||String(req.user._id)===String(memberId);

// AUTHENTICATION
r.post('/auth/register',wrap(async(req,res)=>{
  const {name,email,password,memberId,phone}=req.body;
  if(clean(name).length<2||!emailPattern.test(clean(email))||!password||password.length<8||clean(memberId).length<2)fail(400,'Name, valid email, member ID and password (minimum 8 characters) are required.');
  const existing=await User.findOne({$or:[{email:clean(email).toLowerCase()},{memberId:clean(memberId)}]});
  if(existing)fail(409,'Email or member ID already exists.');
  const user=await User.create({name:clean(name),email:clean(email).toLowerCase(),memberId:clean(memberId),phone:clean(phone),password:await bcrypt.hash(password,12),role:'member'});
  res.status(201).json({token:tokenFor(user),user:safeUser(user)});
}));
r.post('/auth/login',wrap(async(req,res)=>{
  const email=clean(req.body.email).toLowerCase();const password=req.body.password;
  if(!email||!password)fail(400,'Email and password are required.');
  const user=await User.findOne({email}).select('+password');
  if(!user||!(await bcrypt.compare(password,user.password)))fail(401,'Incorrect email or password.');
  if(!user.isActive)fail(403,'Your account has been deactivated.');
  res.json({token:tokenFor(user),user:safeUser(user)});
}));
r.get('/auth/me',protect,wrap(async(req,res)=>res.json({user:safeUser(req.user)})));
r.put('/users/profile',protect,wrap(async(req,res)=>{
  const {name,phone,currentPassword,newPassword}=req.body;
  if(name!==undefined){if(clean(name).length<2)fail(400,'Name must contain at least two characters.');req.user.name=clean(name);}
  if(phone!==undefined)req.user.phone=clean(phone);
  if(newPassword){
    if(newPassword.length<8||!currentPassword)fail(400,'Enter the current password and a new password of at least eight characters.');
    const full=await User.findById(req.user._id).select('+password');
    if(!(await bcrypt.compare(currentPassword,full.password)))fail(400,'Current password is incorrect.');
    req.user.password=await bcrypt.hash(newPassword,12);
  }
  await req.user.save();res.json({user:safeUser(req.user)});
}));

// USERS AND LIBRARIANS
r.get('/users',...staff,wrap(async(req,res)=>{
  const {page,limit,skip}=pagination(req);
  const filter={};if(req.query.role&&['member','librarian','admin'].includes(req.query.role))filter.role=req.query.role;
  if(req.query.q){const safe=clean(req.query.q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{name:{$regex:safe,$options:'i'}},{email:{$regex:safe,$options:'i'}},{memberId:{$regex:safe,$options:'i'}}];}
  const [items,total]=await Promise.all([User.find(filter).select('-password').sort({createdAt:-1}).skip(skip).limit(limit),User.countDocuments(filter)]);
  res.json({items,total,page,pages:Math.ceil(total/limit)});
}));
r.post('/users',...staff,wrap(async(req,res)=>{
  const {name,email,password,memberId,role='member',phone}=req.body;
  if(role==='admin'||(role==='librarian'&&req.user.role!=='admin')||!['member','librarian'].includes(role))fail(403,'Not permitted to create this role.');
  if(clean(name).length<2||!emailPattern.test(clean(email))||!password||password.length<8)fail(400,'Name, valid email and password (8+ characters) are required.');
  if(role==='member'&&clean(memberId).length<2)fail(400,'Member ID is required for members.');
  const user=await User.create({name:clean(name),email:clean(email).toLowerCase(),password:await bcrypt.hash(password,12),memberId:role==='member'?clean(memberId):undefined,role,phone:clean(phone)});
  res.status(201).json({user:safeUser(user)});
}));
r.put('/users/:id/status',...admin,wrap(async(req,res)=>{
  if(typeof req.body.isActive!=='boolean')fail(400,'isActive must be true or false.');
  if(String(req.user._id)===req.params.id)fail(400,'You cannot deactivate your own account.');
  const user=await User.findByIdAndUpdate(objectId(req.params.id),{isActive:req.body.isActive},{new:true});if(!user)fail(404,'User not found.');
  res.json({user:safeUser(user)});
}));
r.delete('/users/:id',...admin,wrap(async(req,res)=>{
  const id=objectId(req.params.id);
  if(id===String(req.user._id))fail(400,'You cannot delete yourself.');
  const user=await User.findById(id);if(!user)fail(404,'User not found.');
  if(user.role==='member'&&(await Loan.exists({member:id})||await Reservation.exists({member:id})))fail(409,'Member has borrowing or reservation history. Deactivate the account instead.');
  if(user.role==='librarian'&&await Loan.exists({issuedBy:id}))fail(409,'Librarian has issue history. Deactivate the account instead.');
  await user.deleteOne();res.json({message:'User deleted.'});
}));

// CATEGORIES
r.get('/categories',wrap(async(_req,res)=>res.json({items:await Category.find().sort({name:1})})));
r.post('/categories',...staff,wrap(async(req,res)=>{
  if(clean(req.body.name).length<2)fail(400,'Category name is required.');
  const category=await Category.create({name:clean(req.body.name),description:clean(req.body.description)});
  res.status(201).json({category});
}));
r.delete('/categories/:id',...staff,wrap(async(req,res)=>{
  const id=objectId(req.params.id);if(await Book.exists({category:id}))fail(409,'This category has books and cannot be deleted.');
  await Category.findByIdAndDelete(id);res.json({message:'Category deleted.'});
}));

// PUBLIC BOOK CATALOGUE
r.get('/books',wrap(async(req,res)=>{
  const {page,limit,skip}=pagination(req);
  const filter={};
  if(req.query.q){const safe=clean(req.query.q).slice(0,120).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{title:{$regex:safe,$options:'i'}},{author:{$regex:safe,$options:'i'}},{isbn:{$regex:safe,$options:'i'}}];}
  if(req.query.category)filter.category=objectId(req.query.category);
  if(req.query.available==='true')filter.availableCopies={$gt:0};
  const sort=req.query.sort==='newest'?{createdAt:-1}:{title:1};
  const [items,total]=await Promise.all([Book.find(filter).populate('category','name').sort(sort).skip(skip).limit(limit),Book.countDocuments(filter)]);
  res.json({items,total,page,pages:Math.ceil(total/limit)});
}));
r.get('/books/:id',wrap(async(req,res)=>{
  const book=await Book.findById(objectId(req.params.id)).populate('category','name');if(!book)fail(404,'Book not found.');
  const earliest=await Loan.findOne({book:book._id,status:{$in:['issued','overdue']}}).sort({dueDate:1}).select('dueDate');
  res.json({book,expectedReturnDate:earliest?.dueDate||null});
}));
r.post('/books',...staff,wrap(async(req,res)=>{
  const {title,author,isbn,category,publisher,publishedYear,totalCopies,coverImage,shelfLocation,description}=req.body;
  if(!clean(title)||!clean(author)||!clean(isbn)||!validObjectId(category)||!digits(totalCopies,1,9999))fail(400,'Title, author, ISBN, category and valid total copies are required.');
  if(!await Category.exists({_id:category}))fail(400,'Category not found.');
  const book=await Book.create({title:clean(title),author:clean(author),isbn:clean(isbn),category,publisher:clean(publisher),publishedYear:publishedYear?Number(publishedYear):undefined,totalCopies:Number(totalCopies),availableCopies:Number(totalCopies),coverImage:clean(coverImage),shelfLocation:clean(shelfLocation),description:clean(description)});
  res.status(201).json({book});
}));
r.put('/books/:id',...staff,wrap(async(req,res)=>{
  const book=await Book.findById(objectId(req.params.id));if(!book)fail(404,'Book not found.');
  const {title,author,isbn,category,publisher,publishedYear,totalCopies,coverImage,shelfLocation,description}=req.body;
  if(!clean(title)||!clean(author)||!clean(isbn)||!validObjectId(category)||!digits(totalCopies,1,9999))fail(400,'Title, author, ISBN, category and valid total copies are required.');
  if(!await Category.exists({_id:category}))fail(400,'Category not found.');
  const borrowed=book.totalCopies-book.availableCopies;
  if(Number(totalCopies)<borrowed)fail(400,`At least ${borrowed} copies are currently on loan. Cannot reduce total copies below that.`);
  Object.assign(book,{title:clean(title),author:clean(author),isbn:clean(isbn),category,publisher:clean(publisher),publishedYear:publishedYear?Number(publishedYear):undefined,totalCopies:Number(totalCopies),availableCopies:Number(totalCopies)-borrowed,coverImage:clean(coverImage),shelfLocation:clean(shelfLocation),description:clean(description)});
  await book.save();res.json({book});
}));
r.delete('/books/:id',...staff,wrap(async(req,res)=>{
  const id=objectId(req.params.id);const book=await Book.findById(id);if(!book)fail(404,'Book not found.');
  if(book.totalCopies!==book.availableCopies)fail(409,'Cannot delete a book while copies are issued.');
  if(await Reservation.exists({book:id,status:{$in:['pending','available']}}))fail(409,'Cannot delete a book with active reservations.');
  // Preserve referenced historical loans by disallowing removal of titles with circulation history.
  if(await Loan.exists({book:id}))fail(409,'This book has circulation history. Keep its record for reporting.');
  await book.deleteOne();res.json({message:'Book deleted.'});
}));

// ISSUE, RETURN, RENEW AND FINES
r.post('/transactions/issue',...staff,wrap(async(req,res)=>{
  const bookId=objectId(req.body.book);const memberId=objectId(req.body.member);
  await expireReservations();
  const [member,book,settings]=await Promise.all([User.findById(memberId),Book.findById(bookId),getSettings()]);
  if(!member||member.role!=='member'||!member.isActive)fail(400,'Please select an active member.');
  if(!book)fail(404,'Book not found.');
  if(book.availableCopies<1)fail(409,'No copies available to issue.');
  const activeCount=await Loan.countDocuments({member:memberId,status:{$in:['issued','overdue']}});
  if(activeCount>=settings.maxBooksPerMember)fail(409,`Borrowing limit reached (${settings.maxBooksPerMember} books).`);
  const unpaid=await Loan.aggregate([{$match:{member:member._id,fineAmount:{$gt:0},finePaid:false}},{$group:{_id:null,total:{$sum:'$fineAmount'}}}]);
  if((unpaid[0]?.total||0)>settings.maxUnpaidFine)fail(409,'This member has unpaid fines above the allowed limit.');
  if(await Loan.exists({book:bookId,member:memberId,status:{$in:['issued','overdue']}}))fail(409,'Member already has an active loan for this title.');
  const activeHolds=await Reservation.find({book:bookId,status:'available'}).sort({reservedAt:1});
  const reserved=activeHolds.find(x=>String(x.member)===memberId);
  if(!reserved&&activeHolds.length>=book.availableCopies)fail(409,'Available copies are reserved for other members.');
  // Atomic conditional decrement prevents overselling the final copy across simultaneous requests.
  const decremented=await Book.findOneAndUpdate({_id:bookId,availableCopies:{$gt:0}},{$inc:{availableCopies:-1}},{new:true});
  if(!decremented)fail(409,'The last copy was just issued. Please refresh.');
  try{
    const loan=await Loan.create({book:bookId,member:memberId,issuedBy:req.user._id,dueDate:daysFrom(new Date(),settings.loanPeriodDays)});
    if(reserved){reserved.status='fulfilled';await reserved.save();}
    await notify(memberId,'Book issued',`${book.title} was issued to you. Due ${loan.dueDate.toLocaleDateString('en-IN')}.`,{type:'success'});
    res.status(201).json({loan:await loan.populate([{path:'book',select:'title author'},{path:'member',select:'name memberId'}])});
  }catch(err){await Book.updateOne({_id:bookId},{$inc:{availableCopies:1}});throw err;}
}));
r.get('/transactions/my',protect,wrap(async(req,res)=>{
  if(req.user.role!=='member')fail(403,'Member-only endpoint.');
  const items=await Loan.find({member:req.user._id}).populate('book','title author coverImage isbn').sort({issueDate:-1});
  const settings=await getSettings();
  res.json({items:items.map(l=>({...l.toObject(),currentFine:l.returnDate?l.fineAmount:fineFor(l.dueDate,new Date(),settings.finePerDay)}))});
}));
r.get('/transactions',...staff,wrap(async(req,res)=>{
  const {page,limit,skip}=pagination(req);const filter={};
  if(['issued','returned','overdue'].includes(req.query.status))filter.status=req.query.status;
  if(req.query.member)filter.member=objectId(req.query.member);
  const [items,total]=await Promise.all([Loan.find(filter).populate('book','title isbn').populate('member','name memberId email').populate('issuedBy','name').sort({createdAt:-1}).skip(skip).limit(limit),Loan.countDocuments(filter)]);
  const settings=await getSettings();
  res.json({items:items.map(l=>({...l.toObject(),currentFine:l.returnDate?l.fineAmount:fineFor(l.dueDate,new Date(),settings.finePerDay)})),total,page,pages:Math.ceil(total/limit)});
}));
r.put('/transactions/:id/return',...staff,wrap(async(req,res)=>{
  const id=objectId(req.params.id);const settings=await getSettings();
  const current=await Loan.findById(id);if(!current)fail(404,'Loan not found.');
  if(current.returnDate)fail(409,'This book has already been returned.');
  const now=new Date();const amount=fineFor(current.dueDate,now,settings.finePerDay);
  const loan=await Loan.findOneAndUpdate({_id:id,returnDate:null,status:{$in:['issued','overdue']}},{$set:{returnDate:now,status:'returned',fineAmount:amount,finePaid:amount===0}},{new:true});
  if(!loan)fail(409,'This book has already been returned.');
  try{
    const stock=await Book.updateOne({_id:loan.book},{$inc:{availableCopies:1}});
    if(!stock.matchedCount)throw new Error('Referenced book not found during return');
  }catch(e){
    await Loan.updateOne({_id:id,returnDate:now},{$set:{returnDate:null,status:current.status,fineAmount:current.fineAmount,finePaid:current.finePaid}});
    throw e;
  }
  try{await offerNextReservation(loan.book);}catch(e){console.error('Reservation follow-up error:',e.message);}
  await notify(loan.member,'Book returned',amount?`Your book was returned with a fine of ₹${amount}.`:'Your book was returned successfully.',{type:amount?'warning':'success'});
  res.json({loan,amount});
}));
r.put('/transactions/:id/renew',protect,wrap(async(req,res)=>{
  const loan=await Loan.findById(objectId(req.params.id)).populate('book','title');
  if(!loan)fail(404,'Loan not found.');
  if(!memberOrStaff(req,loan.member))fail(403,'You cannot renew another member’s loan.');
  if(loan.returnDate||!['issued','overdue'].includes(loan.status))fail(409,'Only active loans can be renewed.');
  if(loan.renewCount>=1)fail(409,'This loan has already been renewed once.');
  if(new Date(loan.dueDate)<new Date())fail(409,'Overdue loans cannot be renewed. Please contact the librarian.');
  if(await Reservation.exists({book:loan.book._id,status:{$in:['pending','available']}}))fail(409,'This book has pending reservations and cannot be renewed.');
  const settings=await getSettings();
  const updated=await Loan.findOneAndUpdate({_id:loan._id,renewCount:0,returnDate:null,dueDate:{$gte:new Date()}},{$inc:{renewCount:1},$set:{dueDate:daysFrom(loan.dueDate,settings.loanPeriodDays)}},{new:true});
  if(!updated)fail(409,'Unable to renew this loan.');
  await notify(loan.member,'Loan renewed',`${loan.book.title} renewed until ${updated.dueDate.toLocaleDateString('en-IN')}.`,{type:'success'});
  res.json({loan:updated});
}));
r.put('/transactions/:id/pay-fine',...staff,wrap(async(req,res)=>{
  const loan=await Loan.findById(objectId(req.params.id));if(!loan)fail(404,'Loan not found.');
  if(!loan.returnDate||loan.fineAmount<=0)fail(400,'No payable fine exists for this loan.');
  if(loan.finePaid)fail(409,'Fine already paid.');
  loan.finePaid=true;await loan.save();await notify(loan.member,'Fine paid',`Your fine of ₹${loan.fineAmount} was marked paid.`,{type:'success'});res.json({loan});
}));

// RESERVATIONS
r.post('/reservations',protect,allow('member'),wrap(async(req,res)=>{
  const bookId=objectId(req.body.book);await expireReservations();
  const book=await Book.findById(bookId);if(!book)fail(404,'Book not found.');
  if(book.availableCopies>0)fail(409,'This book has available copies. Please contact the librarian to borrow it.');
  if(await Reservation.exists({book:bookId,member:req.user._id,status:{$in:['pending','available']}}))fail(409,'You already have an active reservation for this book.');
  if(await Loan.exists({book:bookId,member:req.user._id,status:{$in:['issued','overdue']}}))fail(409,'You already have this book on loan.');
  const reservation=await Reservation.create({book:bookId,member:req.user._id});
  const position=await Reservation.countDocuments({book:bookId,status:'pending',reservedAt:{$lte:reservation.reservedAt}});
  res.status(201).json({reservation,position});
}));
r.get('/reservations/my',protect,allow('member'),wrap(async(req,res)=>{
  await expireReservations();const items=await Reservation.find({member:req.user._id}).populate('book','title author coverImage').sort({reservedAt:-1});res.json({items});
}));
r.get('/reservations',...staff,wrap(async(req,res)=>{
  await expireReservations();const filter={};if(req.query.status)filter.status=req.query.status;
  const items=await Reservation.find(filter).populate('book','title isbn').populate('member','name memberId email').sort({reservedAt:1}).limit(300);res.json({items});
}));
r.delete('/reservations/:id',protect,wrap(async(req,res)=>{
  const rsv=await Reservation.findById(objectId(req.params.id));if(!rsv)fail(404,'Reservation not found.');
  if(!memberOrStaff(req,rsv.member))fail(403,'Cannot cancel another member’s reservation.');
  if(!['pending','available'].includes(rsv.status))fail(409,'This reservation is already closed.');
  rsv.status='cancelled';await rsv.save();await offerNextReservation(rsv.book);res.json({message:'Reservation cancelled.'});
}));

// LIBRARY SETTINGS
r.get('/settings',...admin,wrap(async(_req,res)=>res.json({settings:await getSettings()})));
r.put('/settings',...admin,wrap(async(req,res)=>{
  const s=await getSettings();
  for(const [key,min,max] of [['loanPeriodDays',1,365],['finePerDay',0,10000],['maxBooksPerMember',1,50],['maxUnpaidFine',0,100000]]){
    if(req.body[key]===undefined)continue;
    if(!Number.isFinite(Number(req.body[key]))||Number(req.body[key])<min||Number(req.body[key])>max||(key==='loanPeriodDays'||key==='maxBooksPerMember')&&!Number.isInteger(Number(req.body[key])))fail(400,`Invalid ${key}.`);
    s[key]=Number(req.body[key]);
  }
  await s.save();res.json({settings:s});
}));

// NOTIFICATIONS
r.get('/notifications',protect,wrap(async(req,res)=>{
  const items=await Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(50);
  const unread=await Notification.countDocuments({user:req.user._id,read:false});res.json({items,unread});
}));
r.put('/notifications/:id/read',protect,wrap(async(req,res)=>{
  const item=await Notification.findOneAndUpdate({_id:objectId(req.params.id),user:req.user._id},{$set:{read:true}},{new:true});if(!item)fail(404,'Notification not found.');res.json({item});
}));
r.put('/notifications/read-all',protect,wrap(async(req,res)=>{
  await Notification.updateMany({user:req.user._id,read:false},{$set:{read:true}});res.json({message:'All notifications marked read.'});
}));

// REPORTING AND EXPORTS
r.get('/reports/dashboard',...staff,wrap(async(_req,res)=>{
  const [totalTitles,totalMembers,activeLoans,overdueLoans,returnedLoans,totals,recentLoans,monthly]=await Promise.all([
    Book.countDocuments(),User.countDocuments({role:'member',isActive:true}),Loan.countDocuments({status:{$in:['issued','overdue']}}),
    Loan.countDocuments({$or:[{status:'overdue'},{status:'issued',dueDate:{$lt:new Date()}}]}),Loan.countDocuments({status:'returned'}),
    Book.aggregate([{$group:{_id:null,copies:{$sum:'$totalCopies'},available:{$sum:'$availableCopies'}}}]),
    Loan.find().populate('book','title').populate('member','name').sort({createdAt:-1}).limit(6),
    Loan.aggregate([{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$issueDate'}},count:{$sum:1}}},{$sort:{_id:-1}},{$limit:6}])
  ]);
  const fines=await Loan.aggregate([{$match:{finePaid:true,fineAmount:{$gt:0}}},{$group:{_id:null,total:{$sum:'$fineAmount'}}}]);
  res.json({totalTitles,totalMembers,activeLoans,overdueLoans,returnedLoans,totalCopies:totals[0]?.copies||0,availableCopies:totals[0]?.available||0,finesCollected:fines[0]?.total||0,recentLoans,monthly:monthly.reverse()});
}));
async function reportItems(type){
  if(type==='overdue'){
    const loans=await Loan.find({returnDate:null,dueDate:{$lt:new Date()}}).populate('book','title isbn').populate('member','name memberId').sort({dueDate:1});
    return {title:'Overdue books',headers:['Book','Member','Member ID','Due date','Days overdue'],rows:loans.map(x=>[x.book?.title||'—',x.member?.name||'—',x.member?.memberId||'—',x.dueDate.toISOString().slice(0,10),Math.ceil((Date.now()-x.dueDate)/86400000)])};
  }
  if(type==='popular-books'){
    const grouped=await Loan.aggregate([{$group:{_id:'$book',count:{$sum:1}}},{$sort:{count:-1}},{$limit:100}]);
    const books=await Book.find({_id:{$in:grouped.map(x=>x._id)}}).lean();const map=new Map(books.map(b=>[String(b._id),b]));
    return {title:'Most borrowed books',headers:['Book','Author','Times issued'],rows:grouped.map(x=>[map.get(String(x._id))?.title||'Deleted book',map.get(String(x._id))?.author||'—',x.count])};
  }
  if(type==='monthly'){
    const monthly=await Loan.aggregate([{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$issueDate'}},count:{$sum:1}}},{$sort:{_id:-1}}]);
    return {title:'Monthly issues',headers:['Month','Books issued'],rows:monthly.map(x=>[x._id,x.count])};
  }
  if(type==='members'){
    const users=await User.find({role:'member'}).sort({name:1});
    return {title:'Library members',headers:['Name','Email','Member ID','Active'],rows:users.map(x=>[x.name,x.email,x.memberId||'—',x.isActive?'Yes':'No'])};
  }
  fail(404,'Unknown report type.');
}
// JSON, CSV and PDF formats are available for every report.
r.get('/reports/:type',...staff,wrap(async(req,res)=>{
  const report=await reportItems(req.params.type);const format=req.query.format||'json';
  if(format==='csv'){
    const quote=v=>`"${String(v??'').replaceAll('"','""')}"`;
    const csv=[report.headers,...report.rows].map(row=>row.map(quote).join(',')).join('\r\n');
    res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${req.params.type}.csv"`});return res.send('\ufeff'+csv);
  }
  if(format==='pdf'){
    res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${req.params.type}.pdf"`});
    const pdf=new PDFDocument({margin:44,size:'A4'});pdf.pipe(res);pdf.fontSize(19).fillColor('#173b53').text('Pustakaalay Library');pdf.moveDown(.25).fontSize(14).text(report.title);pdf.moveDown(.8);
    const printable=report.rows.slice(0,250);
    for(const row of [report.headers,...printable]){
      const line=row.map(x=>String(x??'').replace(/[^\x20-\x7E]/g,'?')).join('  |  ');
      if(pdf.y>745)pdf.addPage();pdf.fontSize(8).fillColor('#253c52').text(line,{width:510});pdf.moveDown(.5);
    }
    if(report.rows.length>250)pdf.text('Output limited to first 250 rows.');
    pdf.end();return;
  }
  res.json(report);
}));
export default r;
