import React,{createContext,useContext,useState,useEffect} from 'react';import {CheckCircle2,X,AlertCircle} from 'lucide-react';
const C=createContext(()=>{});let counter=0;
export function ToastProvider({children}){const [items,setItems]=useState([]);
const toast=(message,type='success')=>{const id=++counter;setItems(old=>[...old,{id,message,type}]);setTimeout(()=>setItems(old=>old.filter(i=>i.id!==id)),4400);};
return <C.Provider value={toast}>{children}<div className="toast-stack">{items.map(t=><div key={t.id} className={`toast ${t.type}`}><span>{t.type==='success'?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}</span>{t.message}<button onClick={()=>setItems(old=>old.filter(i=>i.id!==t.id))}><X size={15}/></button></div>)}</div></C.Provider>;
}export const useToast=()=>useContext(C);
