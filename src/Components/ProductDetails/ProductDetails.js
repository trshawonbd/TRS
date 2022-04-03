import React, { useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { mainContext } from '../../App';


const ProductDetails = () => {
  const navigate = useNavigate()
  const context = useContext(mainContext)
  console.log(context)
  const [products] = context;
  console.log(products)
    const {id} = useParams()
    console.log(id)
    
     const product  = products.find ((pd) => pd._id === id);
    console.log(product) 
    
    return (
        <div>
          <button onClick={() => navigate(-1)} className=' bg-orange-100'>Back to shop</button>
          <h3>Product Details: {product.name}</h3>
          <img src={product.picture} alt="" srcset="" />  
        </div>
    );
};

export default ProductDetails;