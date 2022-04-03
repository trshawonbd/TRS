import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ProductContext } from '../Product/Product';
import { ProductsContext } from '../Shop/Shop';

const ProductDetails = () => {
    const context = useContext(ProductContext)
    console.log(context)
    const {products} = context
    console.log(products)
    const {id} = useParams()
    console.log(id)
    
   /*  const product  = products.find ((pd) => pd._id === id);
    console.log(product) */
    
    return (
        <div>
          {/*  { <h3>Product Details: {product.name}</h3> } */}
        </div>
    );
};

export default ProductDetails;