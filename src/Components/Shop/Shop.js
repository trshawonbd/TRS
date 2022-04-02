import React, { createContext } from 'react';
import useProducts from '../../hooks/useProducts';
import Product from '../Product/Product';
import './Shop.css'


export const ProductsContext = createContext([])

const Shop = () => {
    const [products, setProducts] = useProducts([])
    /* console.log(products) */
    return (
        <ProductsContext.Provider value={[products, setProducts]}>
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

                    </div>
                </div>

            </div>
        </ProductsContext.Provider>
    );
};

export default Shop;