import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../utilities/logo.png'
import './Header.css'

const Header = () => {
    let activeStyle = {
        textDecoration: "underline"
    };
    return (
        <div className='flex justify-around items-center bg-teal-100'>
            <div className="img-container">
                <img src={logo} alt="" srcset="" />
            </div>
            <div className="link-container">
                <NavLink className = 'li'
                    to="/"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                    
                </NavLink>
                <NavLink className = 'li'
                    to="/home"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                    Home
                </NavLink>
                <NavLink className = 'li'
                    to="/shop"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                   Shop
                </NavLink>
                <NavLink className = 'li'
                    to="/order"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                   Order
                </NavLink>
                <NavLink className = 'li'
                    to="/about"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                    About Us
                </NavLink>
            </div>
        </div>
    );
};

export default Header;