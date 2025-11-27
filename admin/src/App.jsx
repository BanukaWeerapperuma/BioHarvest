import React, { useContext } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Blog from './pages/Blog/Blog'
import EditBlog from './pages/Blog/EditBlog'
import Courses from './pages/Courses/Courses'
import AddCourse from './pages/Courses/AddCourse'
import EditCourse from './pages/Courses/EditCourse'
import PageManage from './pages/PageManage/PageManage'
import Analytics from './pages/Analytics/Analytics'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login/Login'
import ResetCredentials from './components/ResetCredentials/ResetCredentials'
import { StoreContext } from './context/StoreContext'

const App = () => {
  const { token, admin } = useContext(StoreContext);

  return (
    <div className='app'>
      <ToastContainer/>
      <Navbar/>
      <hr />
      <div className="app-content">
        {token && admin && <Sidebar/>}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Login/>}/>
            <Route path="/reset-credentials" element={token && admin ? <ResetCredentials/> : <Login/>}/>
            <Route path="/add" element={<Add/>}/>
            <Route path="/list" element={<List/>}/>
            <Route path="/orders" element={<Orders/>}/>
            <Route path="/blog" element={<Blog/>}/>
            <Route path="/blog/edit/:id" element={<EditBlog/>}/>
            <Route path="/courses" element={<Courses/>}/>
            <Route path="/add-course" element={<AddCourse/>}/>
            <Route path="/edit-course/:id" element={<EditCourse/>}/>
            <Route path="/page-manage" element={<PageManage/>}/>
            <Route path="/analytics" element={<Analytics/>}/>
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
