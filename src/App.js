
import './App.css';
import Promotion from './Components/Promotion/Promotion';
import Header from './Components/Header/Header';
import { Route, Routes } from 'react-router-dom';
import Home from './Components/Home/Home';
import About from './Components/About/About';
import Shop from './Components/Shop/Shop';
import Order from './Components/Order/Order';

function App() {
  return (
    <div className="App">
      <Promotion></Promotion>
      <Header></Header>
      <Routes>
        <Route path="/" element={<Home></Home>} />
        <Route path="/home" element={<Home></Home>} />
        <Route path="/about" element={<About></About>} />
        <Route path="/shop" element={<Shop></Shop>} />
        <Route path="/order" element={<Order></Order>} />
      </Routes>
    </div>
  );
}

export default App;
