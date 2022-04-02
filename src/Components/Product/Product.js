import React, { useContext } from 'react';
import { ProductsContext } from '../Shop/Shop';
import './Product.css'


const Product = (props) => {
     console.log(props.product)
        const {name, picture, price} = props.product; 
    
    return (
        <div>

            <div className="t-shirt">
                <img src={picture} alt="" srcset="" />
                <h4>Name:{name}</h4>
                <p>Price:{price}</p>
                <button>Add to cart</button>
            </div>
        </div>
    );
};

export default Product;