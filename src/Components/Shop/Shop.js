import React, { createContext, useState } from 'react';
import useProducts from '../../hooks/useProducts';
import Order from '../Order/Order';
import Product from '../Product/Product';
import ProductDetails from '../ProductDetails/ProductDetails';
import './Shop.css'


export const ProductsContext = createContext([])

const Shop = () => {
    const [products, setProducts] = useProducts([])
    const [cart, setCart] = useState([])

    const addToCart = (selectedProduct) => {
        let newCart = []
        newCart = [...cart, selectedProduct]
        setCart(newCart)
    }

    const details = (selectedProduct) => {

    }
    let value = { products, setProducts, addToCart, cart, setCart, details }
    /* console.log(products) */
    return (
        <ProductsContext.Provider value={value}>
            <div>
                <h2>All Products</h2>
                <div className="shop-container">
                    <div className="products-container">
                        {
                            products.map((product) => <Product
                                key={product._id}
                                product={product}
                            ></Product>)
                        }

                    </div>
                    <div className="cart-container">
                        <Order></Order>

                    </div>
                </div>

            </div>
        </ProductsContext.Provider>
    );
};

export default Shop;