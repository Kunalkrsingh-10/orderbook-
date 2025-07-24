

// import React, { useState, createContext } from 'react';
// import OrderBook from './components/Orderbook.jsx';
// import OrderForm from './components/OrderForm.jsx';
// import PendingOrder from './components/PendingOrder.jsx';
// import './App.css';

// export const OrderBookContext = createContext();

// function App() {
//   const [strikes, setStrikes] = useState([]);
//   const [tickSize, setTickSize] = useState(0.05);
//   const [lotSize, setLotSize] = useState(75);
//   const [niftySpot, setNiftySpot] = useState(22550);
//   const [strikeInput, setStrikeInput] = useState('');
//   const [orderBookType, setOrderBookType] = useState('Call');
//   const [orderBooks, setOrderBooks] = useState({});
//   const [pendingOrders, setPendingOrders] = useState([]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     let newStrikes;
//     if (orderBookType === 'Fut') {
//       newStrikes = [0];
//     } else {
//       newStrikes = strikeInput
//         .split(',')
//         .map(s => parseFloat(s.trim()))
//         .filter(s => !isNaN(s) && Number.isInteger(s));
//       if (newStrikes.length === 0) {
//         alert('Please enter valid strikes');
//         return;
//       }
//     }
//     setOrderBooks((prevOrderBooks) => {
//       const newOrderBooks = { ...prevOrderBooks };
//       newStrikes.forEach((strike) => {
//         if (!newOrderBooks[strike]) {
//           newOrderBooks[strike] = { tickSize, lotSize, niftySpot, orderBookType };
//         } else if (newOrderBooks[strike].orderBookType !== orderBookType) {
//           newOrderBooks[strike].orderBookType = orderBookType;
//         }
//       });
//       setStrikes((prevStrikes) => [...new Set([...prevStrikes, ...newStrikes])]);
//       setStrikeInput('');
//       return newOrderBooks;
//     });
//   };

//   return (
//     <OrderBookContext.Provider
//       value={{
//         strikes,
//         tickSize,
//         lotSize,
//         niftySpot,
//         orderBooks,
//         setOrderBooks,
//         pendingOrders,
//         setPendingOrders,
//         orderBookType,
//       }}
//     >
//       <div className="container">
//         <div className="header">
//           <h1>Order Simulator</h1>
//           <div className="market-stats"></div>
//         </div>
//         <div className="main-content">
//           <div className="order-book-section">
//             <form onSubmit={handleSubmit} className="input-form">
//               <div className="form-group">
//                 <label htmlFor="orderBookType">Order Type:</label>
//                 <select
//                   id="orderBookType"
//                   value={orderBookType}
//                   onChange={(e) => setOrderBookType(e.target.value)}
//                   className="form-input"
//                 >
//                   <option value="Fut">FUT</option>
//                   <option value="Call">Call</option>
//                   <option value="Put">Put</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label htmlFor="strikes">Strikes:</label>
//                 <input
//                   id="strikes"
//                   type="text"
//                   value={strikeInput}
//                   onChange={(e) => setStrikeInput(e.target.value)}
//                   placeholder=""
//                   className="form-input1"
//                   disabled={orderBookType === 'Fut'}
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="tickSize">Tick Size (₹):</label>
//                 <input
//                   id="tickSize"
//                   type="number"
//                   step="0.01"
//                   value={tickSize}
//                   onChange={(e) => setTickSize(parseFloat(e.target.value))}
//                   placeholder="0.05"
//                   className="form-input1"
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="lotSize">Lot Size:</label>
//                 <input
//                   id="lotSize"
//                   type="number"
//                   value={lotSize}
//                   onChange={(e) => setLotSize(parseInt(e.target.value))}
//                   placeholder=" "
//                   className="form-input1"
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="niftySpot">Spot Price (₹):</label>
//                 <input
//                   id="niftySpot"
//                   type="number"
//                   value={niftySpot}
//                   onChange={(e) => setNiftySpot(parseFloat(e.target.value))}
//                   placeholder="22550"
//                   className="form-input1"
//                 />
//               </div>
//               <button type="submit" className="submit-button">
//                 Order Books
//               </button>
//             </form>
//             <OrderBook />
//           </div>
//           <div className="trading-panel">
//             <OrderForm />
//             <PendingOrder />
//           </div>
//         </div>
//       </div>
//     </OrderBookContext.Provider>
//   );
// }

// export default App;

import React, { useState, createContext } from 'react';
import OrderBook from './components/Orderbook.jsx';
import OrderForm from './components/OrderForm.jsx';
import PendingOrder from './components/PendingOrder.jsx';
import './App.css';

export const OrderBookContext = createContext();

function App() {
  const [strikes, setStrikes] = useState([]);
  const [tickSize, setTickSize] = useState(0.05);
  const [lotSize, setLotSize] = useState(75);
  const [niftySpot, setNiftySpot] = useState(22550);
  const [strikeInput, setStrikeInput] = useState('');
  const [orderBookType, setOrderBookType] = useState('Call');
  const [orderBooks, setOrderBooks] = useState({});
  const [pendingOrders, setPendingOrders] = useState([]);
  const [triggerOrderBookGeneration, setTriggerOrderBookGeneration] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    let newStrikes;
    if (orderBookType === 'Fut') {
      newStrikes = [0];
    } else {
      newStrikes = strikeInput
        .split(',')
        .map(s => parseFloat(s.trim()))
        .filter(s => !isNaN(s) && Number.isInteger(s));
      if (newStrikes.length === 0) {
        alert('Please enter valid strikes');
        return;
      }
    }
    setOrderBooks((prevOrderBooks) => {
      const newOrderBooks = { ...prevOrderBooks };
      newStrikes.forEach((strike) => {
        if (!newOrderBooks[strike]) {
          newOrderBooks[strike] = { tickSize, lotSize, niftySpot, orderBookType };
        } else if (newOrderBooks[strike].orderBookType !== orderBookType) {
          newOrderBooks[strike].orderBookType = orderBookType;
        }
      });
      setStrikes((prevStrikes) => [...new Set([...prevStrikes, ...newStrikes])]);
      setStrikeInput('');
      setTriggerOrderBookGeneration((prev) => prev + 1); // Trigger order book generation
      return newOrderBooks;
    });
  };

  return (
    <OrderBookContext.Provider
      value={{
        strikes,
        tickSize,
        lotSize,
        niftySpot,
        orderBooks,
        setOrderBooks,
        pendingOrders,
        setPendingOrders,
        orderBookType,
        triggerOrderBookGeneration
      }}
    >
      <div className="container">
        <div className="header">
          <h1>Order Simulator</h1>
          <div className="market-stats"></div>
        </div>
        <div className="main-content">
          <div className="order-book-section">
            <form onSubmit={handleSubmit} className="input-form">
              <div className="form-group">
                <label htmlFor="orderBookType">Order Type:</label>
                <select
                  id="orderBookType"
                  value={orderBookType}
                  onChange={(e) => setOrderBookType(e.target.value)}
                  className="form-input"
                >
                  <option value="Fut">FUT</option>
                  <option value="Call">Call</option>
                  <option value="Put">Put</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="strikes">Strikes:</label>
                <input
                  id="strikes"
                  type="text"
                  value={strikeInput}
                  onChange={(e) => setStrikeInput(e.target.value)}
                  placeholder=""
                  className="form-input1"
                  disabled={orderBookType === 'Fut'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tickSize">Tick Size (₹):</label>
                <input
                  id="tickSize"
                  type="number"
                  step="0.01"
                  value={tickSize}
                  onChange={(e) => setTickSize(parseFloat(e.target.value))}
                  placeholder="0.05"
                  className="form-input1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lotSize">Lot Size:</label>
                <input
                  id="lotSize"
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseInt(e.target.value))}
                  placeholder=" "
                  className="form-input1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="niftySpot">Spot Price (₹):</label>
                <input
                  id="niftySpot"
                  type="number"
                  value={niftySpot}
                  onChange={(e) => setNiftySpot(parseFloat(e.target.value))}
                  placeholder="22550"
                  className="form-input1"
                />
              </div>
              <button type="submit" className="submit-button">
                Order Books
              </button>
            </form>
            <OrderBook />
          </div>
          <div className="trading-panel">
            <OrderForm />
            <PendingOrder />
          </div>
        </div>
      </div>
    </OrderBookContext.Provider>
  );
}

export default App;