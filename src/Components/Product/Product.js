import React, { useContext } from 'react';
import { ProductsContext } from '../Shop/Shop';
import './Product.css'


const Product = (props) => {

    const { name, picture, price } = props.product;
    const context = useContext(ProductsContext)
    console.log(context)
    const {addToCart} = context
    
    

    return (
        <div>

            <div className="t-shirt">
                <div className='flex justify-center mt-2 rounded'>
                    <img src={picture} alt="" srcset="" />
                </div>

                <h4>Name:{name}</h4>
                <p>Price:{price}</p>
                <div className='mt-4'>
                    <button onClick={() => addToCart(props.product)}  className='add-btn rounded font-bold '>Add to cart</button>
                    <button className='add-btn ml-3 rounded font-bold color-white'>Details</button>
                </div>

            </div>
        </div>
    );
};

export default Product;