import React,{createContext,useContext,useEffect,useState} from 'react';
import api from '../lib/api';
const Context=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('lms_user')||'null');}catch{return null;}});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const off=()=>setUser(null);window.addEventListener('lms:logout',off);if(localStorage.getItem('lms_token'))api.get('/auth/me').then(r=>{setUser(r.data.user);localStorage.setItem('lms_user',JSON.stringify(r.data.user));}).catch(()=>{setUser(null);localStorage.removeItem('lms_token');localStorage.removeItem('lms_user');}).finally(()=>setLoading(false));else setLoading(false);return()=>window.removeEventListener('lms:logout',off);},[]);
  const signIn=async(email,password)=>{const {data}=await api.post('/auth/login',{email,password});localStorage.setItem('lms_token',data.token);localStorage.setItem('lms_user',JSON.stringify(data.user));setUser(data.user);return data.user;};
  const register=async(payload)=>{const {data}=await api.post('/auth/register',payload);localStorage.setItem('lms_token',data.token);localStorage.setItem('lms_user',JSON.stringify(data.user));setUser(data.user);return data.user;};
  const signOut=()=>{localStorage.removeItem('lms_token');localStorage.removeItem('lms_user');setUser(null);};
  const changeUser=u=>{setUser(u);localStorage.setItem('lms_user',JSON.stringify(u));};
  return <Context.Provider value={{user,loading,signIn,register,signOut,changeUser}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
