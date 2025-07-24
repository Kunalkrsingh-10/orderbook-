

import React, { useState, useContext } from 'react';
import { OrderBookContext } from '../App.jsx';

function OrderForm() {
  const { orderBooks, setOrderBooks, setPendingOrders } = useContext(OrderBookContext);
  const [addStrike, setAddStrike] = useState('');
  const [addOptionType, setAddOptionType] = useState('call');
  const [addPrice, setAddPrice] = useState('');
  const [addLots, setAddLots] = useState('');
  const [deleteStrike, setDeleteStrike] = useState('');
  const [deleteOptionType, setDeleteOptionType] = useState('call');
  const [deleteOrderType, setDeleteOrderType] = useState('buy');
  const [deletePrice, setDeletePrice] = useState('');
  const [deleteLots, setDeleteLots] = useState('');

const handleAddOrder = (e, order_type) => {
  e.preventDefault();
  const strike = parseFloat(addStrike);
  const price = parseFloat(addPrice);
  const lots = parseInt(addLots);
  
  if (isNaN(strike) || isNaN(price) || isNaN(lots) || lots <= 0) {
    alert('Please enter valid strike, price, and lots');
    return;
  }
  
  const lotSize = orderBooks[strike]?.lotSize || 75;
  const quantity = lots * lotSize;
  const order_id = `order-${strike}-${addOptionType}-${Date.now()}`;
  const order = { strike, option_type: addOptionType, order_type, price, quantity, order_id };
  
  if (orderBooks[strike]?.[addOptionType]) {
    const book = orderBooks[strike][addOptionType];
    
    // Price validation logic
    let canPlaceInOrderBook = false;
    
    if (order_type === 'buy') {
      // Buy order: price should be within bid range and less than lowest ask
      const highestBid = book.bids[0]?.[0] || 0;
      const lowestBid = book.bids[book.bids.length - 1]?.[0] || 0;
      const lowestAsk = book.asks[0]?.[0] || Infinity;
      
      canPlaceInOrderBook = price >= lowestBid && price <= highestBid && price < lowestAsk;
    } else {
      // Sell order: price should be within ask range and greater than highest bid
      const lowestAsk = book.asks[0]?.[0] || Infinity;
      const highestAsk = book.asks[book.asks.length - 1]?.[0] || Infinity;
      const highestBid = book.bids[0]?.[0] || 0;
      
      canPlaceInOrderBook = price >= lowestAsk && price <= highestAsk && price > highestBid;
    }
    
    if (canPlaceInOrderBook) {
      setOrderBooks((prev) => {
        const updated = { ...prev };
        const book = updated[strike][addOptionType];
        const field = order_type === 'buy' ? 'bids' : 'asks';
        let entries = [...book[field]];
        const existingIndex = entries.findIndex(([p]) => p === price);
        
        if (existingIndex !== -1) {
          entries[existingIndex][1] += quantity;
          entries[existingIndex][2] = `agg-${strike}-${addOptionType}-${Date.now()}`;
        } else {
          entries.push([price, quantity, order_id, entries.length + 1]);
        }
        
        entries.sort((a, b) => order_type === 'buy' ? b[0] - a[0] : a[0] - b[0]);
        
        // Recalculate totals
        const totalKey = order_type === 'buy' ? 'totalBidQty' : 'totalAskQty';
        const totalQty = entries.reduce((sum, [, qty]) => sum + qty, 0);
        
        updated[strike][addOptionType] = {
          ...book,
          [field]: entries.slice(0, 10),
          [totalKey]: totalQty
        };
        
        return updated;
      });
      console.log('Order added to order book:', order);
    } else {
      setPendingOrders((prev) => [...prev, order]);
      console.log('Order added to pending (price out of range):', order);
    }
  } else {
    setPendingOrders((prev) => [...prev, order]);
    console.log('Order added to pending (no order book):', order);
  }
  
  setAddStrike('');
  setAddPrice('');
  setAddLots('');
};
  const handleDeleteOrder = (e) => {
    e.preventDefault();
    const strike = parseFloat(deleteStrike);
    const price = parseFloat(deletePrice);
    const lots = parseInt(deleteLots);
    if (isNaN(strike) || isNaN(price) || isNaN(lots) || lots <= 0) {
      alert('Please enter valid strike, price, and lots');
      return;
    }
    const lotSize = orderBooks[strike]?.lotSize || 75;
    const quantity = lots * lotSize;
    let orderFound = false;

    // Check pending orders
    setPendingOrders((prev) => {
      const updated = prev.map((order) => {
        if (
          order.strike === strike &&
          order.option_type === deleteOptionType &&
          order.order_type === deleteOrderType &&
          order.price === price
        ) {
          const newQuantity = order.quantity - quantity;
          if (newQuantity > 0) {
            orderFound = true;
            console.log(`Reduced pending order: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price} by ${lots} lots`);
            return { ...order, quantity: newQuantity };
          }
          console.log(`Deleted pending order: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price}`);
          orderFound = true;
          return null;
        }
        return order;
      }).filter(Boolean);
      return updated;
    });

    // Check order books
    setOrderBooks((prev) => {
      if (!prev[strike]?.[deleteOptionType]) return prev;
      const book = prev[strike][deleteOptionType];
      const field = deleteOrderType === 'buy' ? 'bids' : 'asks';
      const updatedEntries = book[field].map(([p, qty, id]) => {
        if (p === price) {
          const newQty = qty - quantity;
          if (newQty > 0) {
            console.log(`Reduced order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price} by ${lots} lots`);
            orderFound = true;
            return [p, newQty, `agg-${strike}-${deleteOptionType}-${Date.now()}`];
          }
          console.log(`Deleted from order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price}`);
          orderFound = true;
          return null;
        }
        return [p, qty, id];
      }).filter(Boolean);
      return {
        ...prev,
        [strike]: {
          ...prev[strike],
          [deleteOptionType]: {
            ...book,
            [field]: updatedEntries
          }
        }
      };
    });

    if (!orderFound) {
      alert('No matching order found to delete');
    }

    setDeleteStrike('');
    setDeletePrice('');
    setDeleteLots('');
  };

  return (
    <>
      <div className="add-order-section">
        <h3>Add Order</h3>
        <form className="order-form">
          <div className="form-group">
            <label htmlFor="add-strike">Strike:</label>
            <input
              id="add-strike"
              type="number"
              value={addStrike}
              onChange={(e) => setAddStrike(e.target.value)}
              placeholder="e.g., 22450"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-option-type">Option Type:</label>
            <select
              id="add-option-type"
              value={addOptionType}
              onChange={(e) => setAddOptionType(e.target.value)}
              className="form-input"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
              <option value="fut">FUT</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="add-price">Price (₹):</label>
            <input
              id="add-price"
              type="number"
              step="0.01"
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              placeholder="e.g., 200.00"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-lots">Lots:</label>
            <input
              id="add-lots"
              type="number"
              value={addLots}
              onChange={(e) => setAddLots(e.target.value)}
              placeholder="e.g., 2"
              className="form-input"
            />
            <div className="lot-helper">
              Enter number of lots
            </div>
          </div>
          <div className="side-buttons">
            <button
              className="side-btn buy"
              onClick={(e) => handleAddOrder(e, 'buy')}
            >
              Buy
            </button>
            <button
              className="side-btn sell"
              onClick={(e) => handleAddOrder(e, 'sell')}
            >
              Sell
            </button>
          </div>
        </form>
      </div>
      <div className="delete-order-section">
        <h3>Delete Order</h3>
        <form className="order-form" onSubmit={handleDeleteOrder}>
          <div className="form-group">
            <label htmlFor="delete-strike">Strike:</label>
            <input
              id="delete-strike"
              type="number"
              value={deleteStrike}
              onChange={(e) => setDeleteStrike(e.target.value)}
              placeholder="e.g., 22450"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="delete-option-type">Option Type:</label>
            <select
              id="delete-option-type"
              value={deleteOptionType}
              onChange={(e) => setDeleteOptionType(e.target.value)}
              className="form-input"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
              <option value="fut">FUT</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delete-order-type">Side:</label>
            <select
              id="delete-order-type"
              value={deleteOrderType}
              onChange={(e) => setDeleteOrderType(e.target.value)}
              className="form-input"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="delete-price">Price (₹):</label>
            <input
              id="delete-price"
              type="number"
              step="0.01"
              value={deletePrice}
              onChange={(e) => setDeletePrice(e.target.value)}
              placeholder="e.g., 200.00"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="delete-lots">Lots:</label>
            <input
              id="delete-lots"
              type="number"
              value={deleteLots}
              onChange={(e) => setDeleteLots(e.target.value)}
              placeholder="e.g., 2"
              className="form-input"
            />
            <div className="lot-helper">
              Enter number of lots
            </div>
          </div>
          <button type="submit" className="side-btn sell">
            Delete
          </button>
        </form>
      </div>
    </>
  );
}

export default OrderForm;

