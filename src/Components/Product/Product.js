import React, { createContext, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductsContext } from '../Shop/Shop';
import './Product.css'
export const ProductContext = createContext([])

const Product = (props) => {

    const { name, picture, price, _id } = props.product;
    const context = useContext(ProductsContext)
    
    const { addToCart, details, products } = context
    
    const navigate = useNavigate();
    let value = {products}




    return (
        <ProductContext.Provider value={props.product}>
            <div>

                <div className="t-shirt">
                    <div className='flex justify-center mt-2 rounded'>
                        <img src={picture} alt="" srcset="" />
                    </div>

                    <h4>Name:{name}</h4>
                    <p>Price:{price}</p>
                    <div className='mt-4'>
                        <button onClick={() => addToCart(props.product)} className='add-btn rounded font-bold '>Add to cart</button>
                        <button onClick={() => navigate(`/shop/${_id}`)} className='add-btn ml-3 rounded font-bold color-white'>Details</button>
                    </div>

                </div>
            </div>
        </ProductContext.Provider>

    );
};

export default Product;