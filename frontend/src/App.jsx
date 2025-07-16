import React from 'react'
import Navbar from './Components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './Components/Footer/Footer'
import './App.css'
import { useState } from 'react'
import LoginPopUp from './Components/LoginPopUp/LoginPopUp'
import Verify from './pages/Verify/Verify'
import MyOrders from './pages/Myorders/MyOrders.jsx'
import Learn from './pages/Learn/Learn'
import CourseDashboard from './pages/Learn/CourseDashboard'
import EnrolledCourses from './pages/Learn/EnrolledCourses'
import Community from './pages/Community/community'
import Blog from './pages/Blog/blog'
import BlogPost from './pages/Blog/BlogPost'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import Profile from './pages/Profile/Profile'
import NotFound from './pages/NotFound/NotFound'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {

  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
    { showLogin ? <LoginPopUp setShowLogin={setShowLogin}/> : <> </> }

    <div className='app'>
      <Navbar setShowLogin={setShowLogin} />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/cart' element={<Cart/>} />
        <Route path='/order' element={<PlaceOrder/>} />
        <Route path='/verify' element ={<Verify/>}/>
        <Route path ='/myorders' element={<MyOrders/>} />
        <Route path ='/blog' element={<Blog/>} />
        <Route path ='/blog/:id' element={<BlogPost/>} />
        <Route path ='/community' element={<Community/>} />
        <Route path ='/learn' element={<Learn/>} />
        <Route path ='/enrolled-courses' element={<EnrolledCourses/>} />
        <Route path='/contact-us' element={<Contact/>} />
        <Route path ='/course/:enrollmentId' element={<CourseDashboard/>} />
        <Route path ='/about' element={<About/>} />
        <Route path ='/contact' element={<Contact/>} />
        <Route path ='/profile' element={<Profile/>} />
        <Route path ='*' element={<NotFound/>} />
        
      </Routes>
    </div>
    <Footer/>
    <ToastContainer 
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    </>
  )
}

export default App