import React, { useContext } from 'react';
import { ProductsContext } from '../Shop/Shop';

const Order = () => {
    let a = useContext(ProductsContext)
    const {cart} = a
    let total = 0 ;
    
    for (const product of cart){
        console.log(product)
        total = total + product.price
    }
    return (
        <div>
            <div>
                <h3 className='font-bold'>Order List</h3>
                <p>Order Items:{cart.length}</p>
                <p>Total Price:{total}</p>
            </div>
        </div>
    );
};

export default Order;