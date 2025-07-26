

import React, { useState, createContext } from 'react';
import OrderBook from './components/Orderbook.jsx';
import OrderForm from './components/OrderForm.jsx';
import PendingOrder from './components/PendingOrder.jsx';
import './App.css';

export const OrderBookContext = createContext();

function App() {
  const [strikes, setStrikes] = useState([]); // Array of { strike, type }
  const [tickSize, setTickSize] = useState(0.05);
  const [lotSize, setLotSize] = useState(75);
  const [bidPrice, setBidPrice] = useState('');
  const [askPrice, setAskPrice] = useState('');
  const [strikeInput, setStrikeInput] = useState('');
  const [orderBookType, setOrderBookType] = useState('Call');
  const [orderBooks, setOrderBooks] = useState({});
  const [pendingOrders, setPendingOrders] = useState([]);
  const [triggerOrderBookGeneration, setTriggerOrderBookGeneration] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedBidPrice = parseFloat(bidPrice);
    const parsedAskPrice = parseFloat(askPrice);
    
    if (isNaN(parsedBidPrice) || isNaN(parsedAskPrice) || parsedAskPrice <= parsedBidPrice) {
      alert('Please enter valid bid and ask prices (ask > bid)');
      return;
    }

    // Round prices to tickSize to avoid floating-point errors
    const roundedBidPrice = Number((Math.round(parsedBidPrice / tickSize) * tickSize).toFixed(3));
    const roundedAskPrice = Number((Math.round(parsedAskPrice / tickSize) * tickSize).toFixed(3));
    
    if (Math.abs(roundedBidPrice - parsedBidPrice) > 1e-12 || Math.abs(roundedAskPrice - parsedAskPrice) > 1e-12) {
      alert(`Bid and ask prices must be multiples of tick size (${tickSize})`);
      console.log('Tick size validation failed:', {
        bidPrice: parsedBidPrice,
        askPrice: parsedAskPrice,
        roundedBidPrice,
        roundedAskPrice,
        bidModulo: parsedBidPrice % tickSize,
        askModulo: parsedAskPrice % tickSize
      });
      return;
    }

    let newStrikes;
    if (orderBookType === 'Fut') {
      newStrikes = [{ strike: 0, type: 'Fut' }];
    } else {
      newStrikes = strikeInput
        .split(',')
        .map(s => parseFloat(s.trim()))
        .filter(s => !isNaN(s) && Number.isInteger(s))
        .map(strike => ({ strike, type: orderBookType }));
      if (newStrikes.length === 0) {
        alert('Please enter valid strikes');
        return;
      }
    }

    // setOrderBooks((prevOrderBooks) => {
    //   const newOrderBooks = { ...prevOrderBooks };
    //   newStrikes.forEach(({ strike, type }) => {
    //     if (!newOrderBooks[strike]) {
    //       newOrderBooks[strike] = { tickSize, lotSize };
    //     }
    //     const typeKey = type.toLowerCase();
    //     newOrderBooks[strike][typeKey] = {
    //       ...newOrderBooks[strike][typeKey],
    //       bidPrice: roundedBidPrice,
    //       askPrice: roundedAskPrice,
    //       tickSize,
    //       lotSize
    //     };
    //   });
    //   console.log('New order books:', newOrderBooks);
    //   return newOrderBooks;
    // });

    setOrderBooks((prevOrderBooks) => {
  const newOrderBooks = { ...prevOrderBooks };
  newStrikes.forEach(({ strike, type }) => {
    const typeKey = type.toLowerCase();
    
    // Check if this strike-type combination already exists
    if (newOrderBooks[strike]?.[typeKey]) {
      alert(`${type} for strike ${strike} already exists!`);
      return; // Skip this iteration, don't update existing
    }
    
    if (!newOrderBooks[strike]) {
      newOrderBooks[strike] = { tickSize, lotSize };
    }
    
    // Only create new entry if it doesn't exist
    newOrderBooks[strike][typeKey] = {
      bidPrice: roundedBidPrice,
      askPrice: roundedAskPrice,
      tickSize,
      lotSize
    };
  });
  console.log('New order books:', newOrderBooks);
  return newOrderBooks;
});

    setStrikes((prevStrikes) => {
  const updated = [...prevStrikes];
  newStrikes.forEach(({ strike, type }) => {
    // Only add if this exact combination doesn't exist
    if (!updated.some(s => s.strike === strike && s.type === type)) {
      updated.push({ strike, type });
    }
  });
  console.log('Updated strikes:', updated);
  return updated;
});

    setStrikeInput('');
    setBidPrice('');
    setAskPrice('');
    setTriggerOrderBookGeneration((prev) => prev + 1);
  };

  return (
    <OrderBookContext.Provider
      value={{
        strikes,
        tickSize,
        lotSize,
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
                <label htmlFor="tickSize">Tick Size:</label>
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
                  placeholder="75"
                  className="form-input1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bidPrice">Bid Price:</label>
                <input
                  id="bidPrice"
                  type="number"
                  step={tickSize}
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder="Enter..."
                  className="form-input1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="askPrice">Ask Price:</label>
                <input
                  id="askPrice"
                  type="number"
                  step={tickSize}
                  value={askPrice}
                  onChange={(e) => setAskPrice(e.target.value)}
                  placeholder="Enter..."
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