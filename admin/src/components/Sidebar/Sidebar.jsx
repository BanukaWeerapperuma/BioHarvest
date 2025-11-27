import React from 'react'
import  './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option">
            <img src={assets.add_icon} alt="" />
            <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>List Items</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Orders</p>
        </NavLink>
        <NavLink to='/blog' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Blog</p>
        </NavLink>
        <NavLink to='/courses' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Courses</p>
        </NavLink>
        <NavLink to='/page-manage' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Page Manage</p>
        </NavLink>
        <NavLink to='/analytics' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Analytics</p>
        </NavLink>
        <NavLink to='/reset-credentials' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Reset Credentials</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
