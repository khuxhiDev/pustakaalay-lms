import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {connectDB} from './config/db.js';
import {User,Category,Book,Loan,Reservation,Settings,Notification} from './models/index.js';
import {daysFrom} from './utils/helpers.js';
const demoPassword=process.env.DEMO_PASSWORD;
if(!demoPassword||demoPassword.length<8){console.error('Set DEMO_PASSWORD (8+ characters) in backend/.env before running the seed command.');process.exit(1);}
const password=await bcrypt.hash(demoPassword,12);
await connectDB();
const admins=[{name:'Ananya Shah',email:'admin@pustakaalay.demo',role:'admin'},{name:'Rohan Mehta',email:'librarian@pustakaalay.demo',role:'librarian'},{name:'Priya Sharma',email:'member@pustakaalay.demo',role:'member',memberId:'STU001'},{name:'Arjun Patel',email:'arjun@pustakaalay.demo',role:'member',memberId:'STU002'},{name:'Ishita Rao',email:'ishita@pustakaalay.demo',role:'member',memberId:'STU003'}];
const people={};
for(const p of admins){people[p.role==='member'?p.memberId:p.role]=await User.findOneAndUpdate({email:p.email},{$set:{...p,password,isActive:true}},{upsert:true,new:true,runValidators:true});}
const cs=[['Computer Science','Software development and technology'],['Self Development','Personal growth and productivity'],['Fiction','Novels and literature'],['Business','Entrepreneurship and management'],['Science','Discoveries and research'],['History','Civilizations and historical events']];
const cats={};for(const [name,description] of cs){cats[name]=await Category.findOneAndUpdate({name},{$set:{description}},{upsert:true,new:true});}
const raw=[
 ['Atomic Habits','James Clear','9780735211292','Self Development',6,5,'Tiny changes, remarkable results.','A-01'],
 ['Deep Work','Cal Newport','9781455586691','Self Development',4,3,'Focus in a distracted world.','A-02'],
 ['Clean Code','Robert C. Martin','9780132350884','Computer Science',5,5,'A handbook of agile software craftsmanship.','B-01'],
 ['Eloquent JavaScript','Marijn Haverbeke','9781593279509','Computer Science',3,3,'A modern introduction to programming.','B-02'],
 ['The Pragmatic Programmer','David Thomas','9780135957059','Computer Science',4,4,'From journeyman to master.','B-03'],
 ['The Psychology of Money','Morgan Housel','9780857197689','Business',5,5,'Timeless lessons on wealth and behavior.','C-01'],
 ['Sapiens','Yuval Noah Harari','9780062316097','History',3,3,'A brief history of humankind.','D-01'],
 ['A Brief History of Time','Stephen Hawking','9780553380163','Science',2,2,'From the big bang to black holes.','E-01'],
 ['The Alchemist','Paulo Coelho','9780061122415','Fiction',4,4,'A story about following your dreams.','F-01'],
 ['1984','George Orwell','9780451524935','Fiction',1,1,'A dystopian classic.','F-02'],
 ['Introduction to Algorithms','Thomas H. Cormen','9780262046305','Computer Science',2,2,'Essential algorithms and data structures.','B-04'],
 ['Thinking, Fast and Slow','Daniel Kahneman','9780374533557','Self Development',3,3,'Two systems that drive the way we think.','A-03'],
];
const bs={};for(const [title,author,isbn,category,totalCopies,unused,description,shelfLocation] of raw){
  bs[title]=await Book.findOneAndUpdate({isbn},{$setOnInsert:{title,author,isbn,category:cats[category]._id,totalCopies,availableCopies:totalCopies,description,shelfLocation}},{upsert:true,new:true});
}
await Settings.findOneAndUpdate({},{$setOnInsert:{loanPeriodDays:14,finePerDay:5,maxBooksPerMember:3,maxUnpaidFine:50}},{upsert:true,new:true});
// Seed a few demonstration loans only if no loans exist yet; safe to rerun without duplicating.
if(await Loan.countDocuments()===0){
  const sample=[
    {book:bs['Atomic Habits'],member:people.STU001,daysAgo:5,dueAgo:-9},
    {book:bs['Deep Work'],member:people.STU001,daysAgo:19,dueAgo:5},
    {book:bs['1984'],member:people.STU002,daysAgo:3,dueAgo:-11},
    {book:bs['Clean Code'],member:people.STU003,daysAgo:26,dueAgo:12,returned:3,finePaid:false}
  ];
  for(const x of sample){const now=new Date();const issueDate=daysFrom(now,-x.daysAgo);const dueDate=daysFrom(now,-x.dueAgo);const returnDate=x.returned?daysFrom(now,-x.returned):null;
    await Loan.create({book:x.book._id,member:x.member._id,issuedBy:people.librarian._id,issueDate,dueDate,returnDate,status:returnDate?'returned':dueDate<now?'overdue':'issued',fineAmount:returnDate?45:0,finePaid:returnDate?x.finePaid:false});
    if(!returnDate)await Book.updateOne({_id:x.book._id},{$inc:{availableCopies:-1}});
  }
  await Reservation.create({book:bs['1984']._id,member:people.STU003,status:'pending'});
}
console.log('\nSeed complete. Sample accounts created/updated.');
console.log('Use your private credentials record for login details. Never commit .env or passwords.');
process.exit(0);
