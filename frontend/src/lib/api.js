import axios from 'axios';
export const API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
const api=axios.create({baseURL:API_URL,timeout:15000});
api.interceptors.request.use(config=>{const token=localStorage.getItem('lms_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(res=>res,err=>{if(err.response?.status===401&&localStorage.getItem('lms_token')){localStorage.removeItem('lms_token');localStorage.removeItem('lms_user');window.dispatchEvent(new Event('lms:logout'));}return Promise.reject(err);});
export function errorText(err){return err?.response?.data?.message||err?.message||'Something went wrong.';}
export default api;
