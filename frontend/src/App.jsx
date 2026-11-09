import React from 'react';import{Navigate,Routes,Route,useLocation}from'react-router-dom';
import{useAuth}from'./context/AuthContext';import{Loading}from'./components/UI';import{Layout,PublicLayout}from'./components/Layout';
import Home from './pages/Home';import About from './pages/About';import Auth from './pages/Auth';import Catalog from './pages/Catalog';import BookDetail from './pages/BookDetail';import Dashboard from './pages/Dashboard';import MemberDashboard from './pages/MemberDashboard';import ManageBooks from './pages/ManageBooks';import Circulation from './pages/Circulation';import UsersPage from './pages/Users';import Reservations from './pages/Reservations';import Reports from './pages/Reports';import SettingsPage from './pages/Settings';import Notifications from './pages/Notifications';import Profile from './pages/Profile';
function Guard({roles,children}){const{user,loading}=useAuth();const location=useLocation();if(loading)return <Loading/>;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;if(roles&&!roles.includes(user.role))return <Navigate to={user.role==='member'?'/member':'/dashboard'} replace/>;return children;}
function Guest({children}){const{user,loading}=useAuth();if(loading)return <Loading/>;if(user)return <Navigate to={user.role==='member'?'/member':'/dashboard'} replace/>;return children;}
export default function App(){const{user}=useAuth();return <Routes><Route element={<PublicLayout/>}><Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/>{!user&&<><Route path="/catalog" element={<Catalog/>}/><Route path="/books/:id" element={<BookDetail/>}/></>}</Route><Route path="/login" element={<Guest><Auth mode="login"/></Guest>}/><Route path="/register" element={<Guest><Auth mode="register"/></Guest>}/>
<Route element={<Guard><Layout/></Guard>}>
  {user&&<><Route path="/catalog" element={<Catalog/>}/><Route path="/books/:id" element={<BookDetail/>}/></>}
  <Route path="/member" element={<Guard roles={['member']}><MemberDashboard/></Guard>}/>
  <Route path="/dashboard" element={<Guard roles={['admin','librarian']}><Dashboard/></Guard>}/>
  <Route path="/manage/books" element={<Guard roles={['admin','librarian']}><ManageBooks/></Guard>}/>
  <Route path="/circulation" element={<Guard roles={['admin','librarian']}><Circulation/></Guard>}/>
  <Route path="/manage/reservations" element={<Guard roles={['admin','librarian']}><Reservations/></Guard>}/>
  <Route path="/manage/users" element={<Guard roles={['admin','librarian']}><UsersPage/></Guard>}/>
  <Route path="/reports" element={<Guard roles={['admin','librarian']}><Reports/></Guard>}/>
  <Route path="/settings" element={<Guard roles={['admin']}><SettingsPage/></Guard>}/>
  <Route path="/notifications" element={<Notifications/>}/><Route path="/profile" element={<Profile/>}/>
</Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
