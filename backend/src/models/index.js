import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const options = { timestamps: true };
const UserSchema = new Schema({
  name: {type:String,required:true,trim:true,maxlength:100},
  email: {type:String,required:true,unique:true,lowercase:true,trim:true},
  password: {type:String,required:true,select:false},
  role: {type:String,enum:['admin','librarian','member'],default:'member'},
  memberId: {type:String,trim:true,sparse:true,unique:true},
  phone: {type:String,default:''},
  isActive: {type:Boolean,default:true}
},options);
export const User = model('User',UserSchema);
const CategorySchema = new Schema({name:{type:String,required:true,unique:true,trim:true},description:{type:String,default:''}},options);
export const Category = model('Category',CategorySchema);
const BookSchema = new Schema({
  title:{type:String,required:true,trim:true},author:{type:String,required:true,trim:true},isbn:{type:String,required:true,unique:true,trim:true},
  category:{type:Schema.Types.ObjectId,ref:'Category',required:true},publisher:{type:String,default:''},publishedYear:{type:Number},
  totalCopies:{type:Number,required:true,min:1},availableCopies:{type:Number,required:true,min:0},
  coverImage:{type:String,default:''},shelfLocation:{type:String,default:''},description:{type:String,default:''}
},options);
BookSchema.index({title:'text',author:'text',isbn:'text'});
export const Book = model('Book',BookSchema);
const LoanSchema = new Schema({
  book:{type:Schema.Types.ObjectId,ref:'Book',required:true},member:{type:Schema.Types.ObjectId,ref:'User',required:true},
  issuedBy:{type:Schema.Types.ObjectId,ref:'User',required:true},issueDate:{type:Date,default:Date.now},dueDate:{type:Date,required:true},
  returnDate:{type:Date,default:null},renewCount:{type:Number,default:0},fineAmount:{type:Number,default:0},
  finePaid:{type:Boolean,default:false},status:{type:String,enum:['issued','returned','overdue'],default:'issued'}
},options);
LoanSchema.index({member:1,status:1});LoanSchema.index({book:1,status:1});
export const Loan = model('Loan',LoanSchema,'transactions');
const ReservationSchema = new Schema({
  book:{type:Schema.Types.ObjectId,ref:'Book',required:true},member:{type:Schema.Types.ObjectId,ref:'User',required:true},
  reservedAt:{type:Date,default:Date.now},expiresAt:{type:Date,default:null},
  status:{type:String,enum:['pending','available','fulfilled','cancelled','expired'],default:'pending'}
},options);
ReservationSchema.index({book:1,status:1,reservedAt:1});
export const Reservation = model('Reservation',ReservationSchema);
const SettingsSchema = new Schema({loanPeriodDays:{type:Number,default:14,min:1,max:365},finePerDay:{type:Number,default:5,min:0},maxBooksPerMember:{type:Number,default:3,min:1,max:50},maxUnpaidFine:{type:Number,default:50,min:0}},options);
export const Settings = model('Settings',SettingsSchema);
const NotificationSchema = new Schema({
  user:{type:Schema.Types.ObjectId,ref:'User',required:true},title:{type:String,required:true},message:{type:String,required:true},
  type:{type:String,enum:['info','success','warning'],default:'info'},read:{type:Boolean,default:false},
  dedupeKey:{type:String,sparse:true,unique:true}
},options);
export const Notification = model('Notification',NotificationSchema);
