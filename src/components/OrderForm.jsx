

import React, { useState, useContext } from 'react';
import { OrderBookContext } from '../App.jsx';

function OrderForm() {
  const { orderBooks, setOrderBooks, setPendingOrders } = useContext(OrderBookContext);
  const [addStrikePrice, setAddStrikePrice] = useState('');
  const [addOptionType, setAddOptionType] = useState('call');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderLots, setOrderLots] = useState('');
  const [deleteStrikePrice, setDeleteStrikePrice] = useState('');
  const [deleteOptionType, setDeleteOptionType] = useState('call');
  const [deleteOrderType, setDeleteOrderType] = useState('buy');
  const [deletePriceLevel, setDeletePriceLevel] = useState('');
  const [deleteOrderQuantity, setDeleteOrderQuantity] = useState('');

  // Get available strike prices for dropdown
  const availableStrikePrices = addOptionType === 'fut' 
    ? [0]
    : Object.keys(orderBooks)
        .filter(strike => orderBooks[strike][addOptionType])
        .map(strike => parseFloat(strike))
        .sort((a, b) => a - b);

  const adjustLevels = (entries, orderType, book, tickSize, lotSize, strike, optionType) => {
    let sortedEntries = [...entries].sort((a, b) => orderType === 'buy' ? b[0] - a[0] : a[0] - b[0]);
    sortedEntries = sortedEntries.map(([p, q, id], i) => [p, q, id, i + 1]);

    if (sortedEntries.length < 10) {
      const isBid = orderType === 'buy';
      const referencePrice = sortedEntries.length > 0 
        ? sortedEntries[sortedEntries.length - 1][0]
        : isBid ? book.bidPrice : book.askPrice;
      const newPrice = Number((referencePrice + (isBid ? -tickSize : tickSize)).toFixed(2));
      const validPrice = isBid 
        ? newPrice > 0 && newPrice < book.askPrice
        : newPrice > book.bidPrice;
      
      if (validPrice) {
        const newQty = lotSize * Math.floor(Math.random() * 5 + 1);
        sortedEntries.push([
          newPrice,
          newQty,
          `${isBid ? 'bid' : 'ask'}-${strike}-${optionType}-${Date.now()}`,
          sortedEntries.length + 1
        ]);
      }
    }

    return sortedEntries;
  };

  const handleAddOrder = (e, order_type) => {
    e.preventDefault();
    
    let strike = parseFloat(addStrikePrice);
    
    // For FUT, force strike to 0
    if (addOptionType === 'fut') {
      strike = 0;
    }

    const price = parseFloat(orderPrice);
    const lots = parseInt(orderLots);

    if (isNaN(strike) || isNaN(price) || isNaN(lots) || lots <= 0) {
      alert('Please enter valid strike, price, and lots');
      return;
    }

    if (!orderBooks[strike]?.[addOptionType]) {
      alert(`No order book exists for ${addOptionType} strike ${strike}`);
      setPendingOrders((prev) => {
        const quantity = lots * (orderBooks[strike]?.lotSize || 75);
        const order_id = `order-${strike}-${addOptionType}-${orderPrice}-${Date.now()}`;
        const order = { strike, option_type: addOptionType, order_type, price, quantity, order_id };
        console.log('Order added to pending (no order book):', order);
        return [...prev, order];
      });
      return;
    }

    const lotSize = orderBooks[strike].lotSize || 75;
    const tickSize = orderBooks[strike][addOptionType].tickSize || 0.05;

    // Round price to nearest tick size
    const roundedPrice = Number((Math.round(price / tickSize) * tickSize).toFixed(2));


  const expectedPrice = Number((Math.round(price / tickSize) * tickSize).toFixed(8));
if (Math.abs(roundedPrice - expectedPrice) > 1e-8) {
  const floorPrice = Number((tickSize * Math.floor(price / tickSize)).toFixed(2));
  const ceilPrice = Number((tickSize * Math.ceil(price / tickSize)).toFixed(2));
  console.log(`Price validation failed: price=${roundedPrice}, expected=${expectedPrice}, tickSize=${tickSize}, strike=${strike}, option_type=${addOptionType}`);
  alert(`Price must be a multiple of tick size (${tickSize}). Valid prices: ${floorPrice}, ${ceilPrice}`);
  return;
}
    const quantity = lots * lotSize;
    const order_id = `order-${strike}-${addOptionType}-${Date.now()}`;
    const order = { strike, option_type: addOptionType, order_type, price: roundedPrice, quantity, order_id };

    const book = orderBooks[strike][addOptionType];
const bestBid = book.bids[0]?.[0] || 0;
const bestAsk = book.asks[0]?.[0] || Infinity;
let canPlaceInOrderBook = false;

if (order_type === 'buy') {
  
  canPlaceInOrderBook = roundedPrice > bestBid;
} else {
   
  canPlaceInOrderBook = roundedPrice < bestAsk;
}

    if (canPlaceInOrderBook) {
      setOrderBooks((prev) => {
        const updated = { ...prev };
        const book = updated[strike][addOptionType];
        const field = order_type === 'buy' ? 'bids' : 'asks';
        let entries = [...book[field]];

        // Find insertion index
        let insertIndex = entries.findIndex(([p]) =>
          order_type === 'buy' ? p < roundedPrice : p > roundedPrice
        );
        if (insertIndex === -1) {
          insertIndex = entries.length;
        }

        // Check if price already exists
        const existingIndex = entries.findIndex(([p]) => Math.abs(p - roundedPrice) < 1e-12);
        if (existingIndex !== -1) {
          // Update quantity at existing price
          entries[existingIndex][1] += quantity;
          entries[existingIndex][2] = `agg-${strike}-${addOptionType}-${Date.now()}`;
        } else {
          // Insert new order and shift rows
          entries.splice(insertIndex, 0, [roundedPrice, quantity, order_id, insertIndex + 1]);
          // Update indices for all entries
          entries = entries.map(([p, q, id], i) => [p, q, id, i + 1]);
        }

        // Sort to ensure correct order
        entries.sort((a, b) => order_type === 'buy' ? b[0] - a[0] : a[0] - b[0]);

        // Update totals
        const totalKey = order_type === 'buy' ? 'totalBidQty' : 'totalAskQty';
        const totalQty = entries.reduce((sum, [, qty]) => sum + qty, 0);

        updated[strike][addOptionType] = {
          ...book,
          [field]: entries.slice(0, 10),
          [totalKey]: totalQty
        };

        console.log(`Inserted ${order_type} order for ${addOptionType} strike ${strike} at ${roundedPrice}:`, updated[strike][addOptionType]);
        return updated;
      });
    } else {
      setPendingOrders((prev) => [...prev, order]);
      alert(`Order added to pending: price (${roundedPrice}) out of range (bid: ${bestBid}, ask: ${bestAsk})`);
      console.log('Order added to pending (price out of range):', order);
    }
  };

  const handleDeleteOrder = (e) => {
    e.preventDefault();
    let strike = parseFloat(deleteStrikePrice);
    const price = parseFloat(deletePriceLevel);
    const lots = parseInt(deleteOrderQuantity);

    if (isNaN(price) || isNaN(lots) || lots <= 0) {
      alert('Please enter valid price and lots');
      return;
    }

    // For FUT, set strike to 0 and ignore input
    if (deleteOptionType === 'fut') {
      strike = 0;
    } else if (isNaN(strike)) {
      alert('Please enter a valid strike for non-FUT orders');
      return;
    }

    const lotSize = orderBooks[strike]?.lotSize || 75;
    const tickSize = orderBooks[strike]?.[deleteOptionType]?.tickSize || 0.05;
    const roundedPrice = Number((Math.round(price / tickSize) * tickSize).toFixed(8));

    let orderFound = false;

    // Check pending orders
    setPendingOrders((prev) => {
      let found =false;
      const updated = prev.map((order) => {
        if (
          order.strike === strike &&
          order.option_type === deleteOptionType &&
          order.order_type === deleteOrderType &&
          Math.abs(order.price - roundedPrice) < 1e-6
        ) {
          const quantity = lots * lotSize;
          const newQuantity = order.quantity - quantity;
          if (newQuantity > 0) {
            found = true;
            console.log(`Reduced pending order: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${roundedPrice} by ${lots} lots`);
            return { ...order, quantity: newQuantity };
          }
          console.log(`Deleted pending order: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${roundedPrice}`);
          found = true;
          return null;
        }
        return order;
      }).filter(Boolean);
      orderFound= orderFound || found;
      return updated;
    });

    // Check order books
    setOrderBooks((prev) => {
      if (!prev[strike]?.[deleteOptionType]) {
        if (!orderFound) {
          alert('No order found to delete at that price');
        }
        return prev;
      }
      let found= false;
      const book = prev[strike][deleteOptionType];
      const field = deleteOrderType === 'buy' ? 'bids' : 'asks';
      let updatedEntries = book[field].map(([p, qty, id, index]) => {
        if (Math.abs(p - roundedPrice) < 1e-6) {
          const quantity = lots * lotSize;
          const newQty = qty - quantity;
          if (newQty > 0) {
            console.log(`Reduced order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${p} by ${lots} lots`);
            found = true;
            return [p, newQty, `agg-${strike}-${deleteOptionType}-${Date.now()}`, index];
          }
          console.log(`Deleted from order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${p}`);
          found = true;
          return null;
        }
        return [p, qty, id, index];
      }).filter(Boolean);

      // Sort and adjust levels
      let sortedEntries = adjustLevels(updatedEntries, deleteOrderType, book, tickSize, lotSize, strike, deleteOptionType);

      // Update totals
      const totalKey = deleteOrderType === 'buy' ? 'totalBidQty' : 'totalAskQty';
      const totalQty = sortedEntries.reduce((sum, [, qty]) => sum + qty, 0);
     orderFound = orderFound || found;
      const updatedBook = {
        ...book,
        [field]: sortedEntries.slice(0, 10),
        [totalKey]: totalQty
      };

      console.log(`Updated order book after deletion for ${deleteOptionType} strike ${strike}:`, updatedBook);

      return {
        ...prev,
        [strike]: {
          ...prev[strike],
          [deleteOptionType]: updatedBook
        }
      };
    });

    setDeleteStrikePrice('');
    setDeletePriceLevel('');
    setDeleteOrderQuantity('');
  };

  // Get tickSize for the selected strike
  const tickSize = addOptionType === 'fut' 
    ? (orderBooks[0]?.fut?.tickSize || 0.05)
    : (orderBooks[addStrikePrice]?.[addOptionType]?.tickSize || 0.05);

  // Snap orderPrice to tickSize on input
  const handlePriceChange = (e) => {
    const inputPrice = parseFloat(e.target.value);
    if (!isNaN(inputPrice)) {
      const roundedPrice = Number((Math.round(inputPrice / tickSize) * tickSize).toFixed(8));
      setOrderPrice(roundedPrice.toString());
    } else {
      setOrderPrice(e.target.value);
    }
  };

  return (
    <>
      <div className="add-order-section">
        <h3>Add Order</h3>
        <form className="order-form">
          <div className="form-group">
            <label htmlFor="add-option-type">Option Type:</label>
            <select
              id="add-option-type"
              value={addOptionType}
              onChange={(e) => {
                setAddOptionType(e.target.value);
                setAddStrikePrice(''); // Reset strike when option type changes
              }}
              className="form-input"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
              <option value="fut">FUT</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="add-strike">Strike:</label>
            <select
              id="add-strike"
              value={addStrikePrice}
              onChange={(e) => setAddStrikePrice(e.target.value)}
              className="form-input"
            >
              <option value="" disabled>Select Strike</option>
              {availableStrikePrices.map(strike => (
                <option key={strike} value={strike}>{strike}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="add-price">Price (₹):</label>
            <input
              id="add-price"
              type="number"
              step={tickSize}
              value={orderPrice}
              onChange={handlePriceChange}
              placeholder="e.g., 24.40"
              className="form-input"
            />
            <div className="lot-helper">
              Enter price in multiples of {tickSize} (e.g., {Number((tickSize * Math.round(24 / tickSize)).toFixed(8))}, {Number((tickSize * (Math.round(24 / tickSize) + 1)).toFixed(8))})
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="add-lots">Lots:</label>
            <input
              id="add-lots"
              type="number"
              value={orderLots}
              onChange={(e) => setOrderLots(e.target.value)}
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
            <label htmlFor="delete-strike">Strike:</label>
            <select
              id="delete-strike"
              value={deleteStrikePrice}
              onChange={(e) => setDeleteStrikePrice(e.target.value)}
              className="form-input"
              disabled={deleteOptionType === 'fut'}
            >
              <option value="" disabled>Select Strike</option>
              {deleteOptionType === 'fut' ? (
                <option value="0">0</option>
              ) : (
                Object.keys(orderBooks)
                  .filter(strike => orderBooks[strike][deleteOptionType])
                  .map(strike => parseFloat(strike))
                  .sort((a, b) => a - b)
                  .map(strike => (
                    <option key={strike} value={strike}>{strike}</option>
                  ))
              )}
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
              value={deletePriceLevel}
              onChange={(e) => setDeletePriceLevel(e.target.value)}
              placeholder="e.g., 24.40"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="delete-lots">Lots:</label>
            <input
              id="delete-lots"
              type="number"
              value={deleteOrderQuantity}
              onChange={(e) => setDeleteOrderQuantity(e.target.value)}
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