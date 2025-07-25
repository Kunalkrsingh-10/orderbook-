

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
    let price = parseFloat(addPrice);
    const lots = parseInt(addLots);

    if (isNaN(strike) || isNaN(price) || isNaN(lots) || lots <= 0) {
      alert('Please enter valid strike, price, and lots');
      return;
    }

    if (!orderBooks[strike]?.[addOptionType]) {
      alert(`No order book exists for ${addOptionType} strike ${strike}`);
      setPendingOrders((prev) => {
        const quantity = lots * (orderBooks[strike]?.lotSize || 75);
        const order_id = `order-${strike}-${addOptionType}-${Date.now()}`;
        const order = { strike, option_type: addOptionType, order_type, price, quantity, order_id };
        console.log('Order added to pending (no order book):', order);
        return [...prev, order];
      });
      setAddStrike('');
      setAddPrice('');
      setAddLots('');
      return;
    }

    const lotSize = orderBooks[strike].lotSize || 75;
    const tickSize = Number((orderBooks[strike].tickSize || 0.05).toFixed(3));

    // Round price to nearest tick size
    price = Number((Math.round(price / tickSize) * tickSize).toFixed(3));

    // Validate price is a multiple of tickSize
    const modulo = Math.abs(price % tickSize);
    if (modulo > 1e-10) {
      const floorPrice = Number((tickSize * Math.floor(price / tickSize)).toFixed(3));
      const ceilPrice = Number((tickSize * Math.ceil(price / tickSize)).toFixed(3));
      console.log(`Price validation failed: price=${price}, tickSize=${tickSize}, modulo=${modulo}, strike=${strike}, option_type=${addOptionType}`);
      alert(`Price must be a multiple of tick size (${tickSize}). Valid prices: ${floorPrice}, ${ceilPrice}`);
      return;
    }

    const quantity = lots * lotSize;
    const order_id = `order-${strike}-${addOptionType}-${Date.now()}`;
    const order = { strike, option_type: addOptionType, order_type, price, quantity, order_id };

    const book = orderBooks[strike][addOptionType];
    const bestBid = book.bids[0]?.[0] || 0;
    const bestAsk = book.asks[0]?.[0] || Infinity;
    let canPlaceInOrderBook = false;

    if (order_type === 'buy') {
      canPlaceInOrderBook = price > bestBid && price < bestAsk;
    } else {
      canPlaceInOrderBook = price < bestAsk && price > bestBid;
    }

    if (canPlaceInOrderBook) {
      setOrderBooks((prev) => {
        const updated = { ...prev };
        const book = updated[strike][addOptionType];
        const field = order_type === 'buy' ? 'bids' : 'asks';
        let entries = [...book[field]];

        // Find insertion index
        let insertIndex = entries.findIndex(([p]) =>
          order_type === 'buy' ? p < price : p > price
        );
        if (insertIndex === -1) {
          insertIndex = entries.length;
        }

        // Check if price already exists
        const existingIndex = entries.findIndex(([p]) => Math.abs(p - price) < 1e-12);
        if (existingIndex !== -1) {
          // Update quantity at existing price
          entries[existingIndex][1] += quantity;
          entries[existingIndex][2] = `agg-${strike}-${addOptionType}-${Date.now()}`;
        } else {
          // Insert new order and shift rows
          entries.splice(insertIndex, 0, [price, quantity, order_id, insertIndex + 1]);
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

        console.log(`Inserted ${order_type} order for ${addOptionType} strike ${strike} at ${price}:`, updated[strike][addOptionType]);
        return updated;
      });
    } else {
      setPendingOrders((prev) => [...prev, order]);
      alert(`Order added to pending: price (${price}) out of range (bid: ${bestBid}, ask: ${bestAsk})`);
      console.log('Order added to pending (price out of range):', order);
    }

    setAddStrike('');
    setAddPrice('');
    setAddLots('');
  };

  const handleDeleteOrder = (e) => {
    e.preventDefault();
    let strike = parseFloat(deleteStrike);
    const price = parseFloat(deletePrice);
    const lots = parseInt(deleteLots);

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
    const quantity = lots * lotSize;

    let orderFound = false;

    // Check pending orders
    setPendingOrders((prev) => {
      const updated = prev.map((order) => {
        if (
          order.strike === strike &&
          order.option_type === deleteOptionType &&
          order.order_type === deleteOrderType &&
          Math.abs(order.price - price) < 1e-12
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
      if (!prev[strike]?.[deleteOptionType]) {
        return prev;
      }
      const book = prev[strike][deleteOptionType];
      const field = deleteOrderType === 'buy' ? 'bids' : 'asks';
      const updatedEntries = book[field].map(([p, qty, id, index]) => {
        if (Math.abs(p - price) < 1e-12) {
          const newQty = qty - quantity;
          if (newQty > 0) {
            console.log(`Reduced order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price} by ${lots} lots`);
            orderFound = true;
            return [p, newQty, `agg-${strike}-${deleteOptionType}-${Date.now()}`, index];
          }
          console.log(`Deleted from order book: ${strike} ${deleteOptionType} ${deleteOrderType} @ ${price}`);
          orderFound = true;
          return null;
        }
        return [p, qty, id, index];
      }).filter(Boolean);

      // Sort to maintain order and update indices
      updatedEntries.sort((a, b) => deleteOrderType === 'buy' ? b[0] - a[0] : a[0] - b[0]);
      const sortedEntries = updatedEntries.map(([p, q, id], i) => [p, q, id, i + 1]);

      // Update totals
      const totalKey = deleteOrderType === 'buy' ? 'totalBidQty' : 'totalAskQty';
      const totalQty = sortedEntries.reduce((sum, [, qty]) => sum + qty, 0);

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

    if (!orderFound) {
      alert('No order found to delete at that price');
    }

    setDeleteStrike('');
    setDeletePrice('');
    setDeleteLots('');
  };

  // Get tickSize for the selected strike (if order book exists)
  const selectedStrike = parseFloat(addStrike);
  const tickSize = Number((orderBooks[selectedStrike]?.tickSize || 0.05).toFixed(3));

  // Snap addPrice to tickSize on input
  const handlePriceChange = (e) => {
    const inputPrice = parseFloat(e.target.value);
    if (!isNaN(inputPrice) && !isNaN(selectedStrike) && orderBooks[selectedStrike]?.[addOptionType]) {
      const roundedPrice = Number((Math.round(inputPrice / tickSize) * tickSize).toFixed(3));
      setAddPrice(roundedPrice.toString());
    } else {
      setAddPrice(e.target.value);
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
              onChange={(e) => setAddOptionType(e.target.value)}
              className="form-input"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
              <option value="fut">FUT</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="add-strike">Strike:</label>
            <input
              id="add-strike"
              type="number"
              value={addStrike}
              onChange={(e) => setAddStrike(e.target.value)}
              placeholder="e.g., 24500"
              className="form-input"
              disabled={addOptionType === 'fut'}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="add-price">Price (₹):</label>
            <input
              id="add-price"
              type="number"
              step={tickSize}
              value={addPrice}
              onChange={handlePriceChange}
              placeholder="e.g., 24.40"
              className="form-input"
            />
            <div className="lot-helper">
              Enter price in multiples of {tickSize} (e.g., {Number((tickSize * Math.round(24 / tickSize)).toFixed(3))}, {Number((tickSize * (Math.round(24 / tickSize) + 1)).toFixed(3))})
            </div>
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
            <input
              id="delete-strike"
              type="number"
              value={deleteOptionType === 'fut' ? '' : deleteStrike}
              onChange={(e) => setDeleteStrike(e.target.value)}
              placeholder={deleteOptionType === 'fut' ? 'N/A for FUT' : 'e.g., 24500'}
              className="form-input"
              disabled={deleteOptionType === 'fut'}
            />
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
              placeholder="e.g., 24.40"
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