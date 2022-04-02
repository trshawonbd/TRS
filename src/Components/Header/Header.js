import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../utilities/logo.png'
import './Header.css'

const Header = () => {
    let activeStyle = {
        textDecoration: "underline"
    };
    return (
        <div>
            <div className="img-container">
                <img src={logo} alt="" srcset="" />
            </div>
            <div className="link-container">
                <NavLink
                    to="/"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                    
                </NavLink>
                <NavLink
                    to="/home"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                    Home
                </NavLink>
                <NavLink
                    to="/shop"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                   Shop
                </NavLink>
                <NavLink
                    to="/order"
                    style={({ isActive }) =>
                        isActive ? activeStyle : undefined
                    }
                >
                   Order
                </NavLink>
                <NavLink
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