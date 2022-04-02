import React, { useState } from 'react';
import './Promotion.css'

const Promotion = () => {

    const [divcon, setDivcon] = useState(false)

    return (

        divcon ||

            <div className='flex bg-green-600 p-3 font-bold text-slate-50 text-xl justify-around'>
            <h2 className=''>Flat Sale 30% </h2>
            <button onClick={() => setDivcon(true)}>X</button> 
        </div>
        
    );
};

export default Promotion;