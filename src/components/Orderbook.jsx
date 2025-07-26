

import React, { useEffect, useState, useContext } from 'react';
import { OrderBookContext } from '../App.jsx';
import OrderBookTable from './OrderBookTable.jsx';

function OrderBook() {
  const { strikes, orderBooks, setOrderBooks, pendingOrders, setPendingOrders, triggerOrderBookGeneration } = useContext(OrderBookContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generateOrderBook = (strike, option_type, tickSize, lotSize, bidPrice, askPrice) => {
    const depth = 10;

    // Validate bidPrice and askPrice
    if (!bidPrice || !askPrice || askPrice <= bidPrice) {
      console.error(`Invalid bidPrice=${bidPrice} or askPrice=${askPrice} for ${option_type} strike ${strike}`);
      throw new Error('Invalid bid or ask price');
    }

    // Ensure prices are tick-aligned
    const alignedBidPrice = Number((Math.round(bidPrice / tickSize) * tickSize).toFixed(2));
    const alignedAskPrice = Number((Math.round(askPrice / tickSize) * tickSize).toFixed(2));
    if (alignedAskPrice <= alignedBidPrice) {
      console.error(`Aligned askPrice=${alignedAskPrice} <= bidPrice=${alignedBidPrice}`);
      throw new Error('Ask price must be greater than bid price after tick alignment');
    }

    // Small deterministic offset for uniqueness
    const typeMultiplier = option_type === 'call' ? 1 : option_type === 'put' ? 2 : 3;
    const offset = Number(((((strike % 100) || 100) + typeMultiplier) * tickSize * 0.01).toFixed(3));
    const finalBidPrice = Number((alignedBidPrice + offset).toFixed(3));
    const finalAskPrice = Number((alignedAskPrice + offset).toFixed(3));

    // Validate final prices
    if (finalAskPrice <= finalBidPrice) {
      console.error(`Final askPrice=${finalAskPrice} <= finalBidPrice=${finalBidPrice}`);
      throw new Error('Final ask price must be greater than final bid price');
    }

    const bids = [];
    const asks = [];
    let totalBidQty = 0;
    let totalAskQty = 0;

    // Build 10 bid levels below finalBidPrice
    for (let depth = 0; depth < 10; depth++) {
      const bid_price = Number((finalBidPrice - depth * tickSize).toFixed(2));
      if (bid_price <= 0 || bid_price >= finalAskPrice) {
        console.log(`Stopping bid generation at depth ${depth}: bid_price=${bid_price}`);
        break;
      }
      const bid_qty = lotSize * randomChoice([1, 2, 3, 5]);
      totalBidQty += bid_qty;
      bids.push([bid_price, bid_qty, `bid-${strike}-${option_type}-${depth}`, depth + 1]);
    }

    // Build 10 ask levels above finalAskPrice
    for (let depth = 0; depth < 10; depth++) {
      const ask_price = Number((finalAskPrice + depth * tickSize).toFixed(2));
      if (ask_price <= finalBidPrice) {
        console.log(`Skipping ask_price=${ask_price} at depth ${depth}: less than finalBidPrice`);
        continue;
      }
      const ask_qty = lotSize * randomChoice([1, 2, 3, 5]);
      totalAskQty += ask_qty;
      asks.push([ask_price, ask_qty, `ask-${strike}-${option_type}-${depth}`, depth + 1]);
    }

    // Ensure no duplicate prices
    const bidPrices = new Set(bids.map(([p]) => p));
    const askPrices = new Set(asks.map(([p]) => p));
    if (bidPrices.size !== bids.length || askPrices.size !== asks.length) {
      console.error(`Duplicate prices detected: bids=${[...bidPrices]}, asks=${[...askPrices]}`);
      throw new Error('Duplicate prices detected in order book');
    }

    console.log(`Generated order book for ${option_type} strike ${strike}:`, { bids, asks, totalBidQty, totalAskQty });
    return { bids, asks, totalBidQty, totalAskQty };
  };

  useEffect(() => {
    if (strikes.length === 0) {
      setLoading(false);
      setError(null);
      console.log('No strikes to process.');
      return;
    }

    setLoading(true);
    try {
      
      setOrderBooks((prevOrderBooks) => {
  const newOrderBooks = { ...prevOrderBooks };
  console.log('Generating order books. Strikes:', strikes, 'Trigger:', triggerOrderBookGeneration);
  strikes.forEach(({ strike, type }) => {
    if (type === 'Fut' && strike !== 0) {
      console.log(`Skipping Fut for strike ${strike}`);
      return;
    }
    if (type !== 'Fut' && strike === 0) {
      console.log(`Skipping ${type} for strike 0`);
      return;
    }

    if (!newOrderBooks[strike]) {
      newOrderBooks[strike] = {
        tickSize: Number((newOrderBooks[strike]?.tickSize || 0.05).toFixed(2)),
        lotSize: newOrderBooks[strike]?.lotSize || 75
      };
    }

    const typeKey = type.toLowerCase();
    const typeData = newOrderBooks[strike][typeKey] || {};
    const tickSize = Number((typeData.tickSize || newOrderBooks[strike].tickSize || 0.05).toFixed(2));
    const lotSize = typeData.lotSize || newOrderBooks[strike].lotSize || 75;
    const bidPrice = typeData.bidPrice || (strike > 0 ? strike * 0.05 : 100);
    const askPrice = typeData.askPrice || (strike > 0 ? strike * 0.05 + 0.05 : 100.05);

    try {
      newOrderBooks[strike][typeKey] = {
        ...typeData,
        ...generateOrderBook(
          strike,
          typeKey,
          tickSize,
          lotSize,
          bidPrice,
          askPrice
        ),
        tickSize,
        lotSize,
        bidPrice,
        askPrice
      };
    } catch (err) {
      console.error(`Error generating order book for ${type} strike ${strike}:`, err);
      throw err;
    }
  });
  console.log('Updated order books:', newOrderBooks);
  return newOrderBooks;
});
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error generating order books:', err);
      setError('Failed to generate order book data: ' + err.message);
      setLoading(false);
    }
  }, [strikes, triggerOrderBookGeneration]);

  useEffect(() => {
    const pendingInterval = setInterval(() => {
      setPendingOrders((prevPending) => {
        const remainingPending = [];
        const ordersToAdd = [];
        prevPending.forEach((order) => {
          const { strike, option_type, order_type, price, quantity, order_id } = order;
          if (orderBooks[strike]?.[option_type]) {
            const book = orderBooks[strike][option_type];
            const bestBid = book.bids[0]?.[0] || 0;
            const bestAsk = book.asks[0]?.[0] || Infinity;
            const tickSize = orderBooks[strike][option_type].tickSize || 0.05;
            if (
              Math.abs(price % tickSize) < 1e-12 &&
              ((order_type === 'buy' && price > bestBid && price < bestAsk) ||
               (order_type === 'sell' && price < bestAsk && price > bestBid))
            ) {
              ordersToAdd.push(order);
            } else {
              remainingPending.push(order);
            }
          } else {
            remainingPending.push(order);
          }
        });
        if (ordersToAdd.length > 0) {
          setOrderBooks((prev) => {
            const updated = { ...prev };
            ordersToAdd.forEach(({ strike, option_type, order_type, price, quantity, order_id }) => {
              if (updated[strike]?.[option_type]) {
                const book = updated[strike][option_type];
                const field = order_type === 'buy' ? 'bids' : 'asks';
                let entries = [...book[field]];
                const insertIndex = entries.findIndex(([p]) =>
                  order_type === 'buy' ? p < price : p > price
                );
                const existingIndex = entries.findIndex(([p]) => Math.abs(p - price) < 1e-12);
                if (existingIndex !== -1) {
                  entries[existingIndex][1] += quantity;
                  entries[existingIndex][2] = `agg-${strike}-${option_type}-${Date.now()}`;
                } else {
                  const newIndex = insertIndex === -1 ? entries.length : insertIndex;
                  entries.splice(newIndex, 0, [price, quantity, order_id, newIndex + 1]);
                  entries = entries.map(([p, q, id], i) => [p, q, id, i + 1]);
                }
                entries.sort((a, b) => order_type === 'buy' ? b[0] - a[0] : a[0] - b[0]);
                updated[strike][option_type] = {
                  ...book,
                  [field]: entries.slice(0, 10),
                  totalBidQty: field === 'bids' ? entries.reduce((sum, [, qty]) => sum + qty, 0) : book.totalBidQty,
                  totalAskQty: field === 'asks' ? entries.reduce((sum, [, qty]) => sum + qty, 0) : book.totalAskQty
                };
              }
            });
            return updated;
          });
        }
        console.log('Processed pending orders. Remaining:', remainingPending, 'Added:', ordersToAdd);
        return remainingPending;
      });
    }, 60000);
    return () => clearInterval(pendingInterval);
  }, [orderBooks, setOrderBooks, pendingOrders, setPendingOrders]);

  const deleteTable = (strike, option_type) => {
    setOrderBooks((prev) => {
      const updated = { ...prev };
      if (updated[strike]) {
        delete updated[strike][option_type];
        if (!updated[strike].call && !updated[strike].put && !updated[strike].fut) {
          delete updated[strike];
        }
      }
      console.log('After deletion, orderBooks:', updated);
      return updated;
    });
    setStrikes((prevStrikes) => {
      const updated = prevStrikes.filter((s) => !(s.strike === strike && s.type.toLowerCase() === option_type));
      console.log('After deletion, strikes:', updated);
      return updated;
    });
    setPendingOrders((prev) => prev.filter(
      (order) => !(order.strike === strike && order.option_type === option_type)
    ));
  };

  if (loading) {
    return <div>Loading order books...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!strikes || strikes.length === 0) {
    return <div>Enter strikes to generate order books</div>;
  }

  return (
    <div className="order-book-container">
      {strikes.map(({ strike, type }, index) => (
        <OrderBookTable
          key={`${strike}-${type}`}
          strike={strike}
          callData={type === 'Call' ? orderBooks[strike]?.call || null : null}
          putData={type === 'Put' ? orderBooks[strike]?.put || null : null}
          futData={type === 'Fut' ? orderBooks[strike]?.fut || null : null}
          setOrderBooks={setOrderBooks}
          deleteTable={deleteTable}
          lotSize={orderBooks[strike]?.[type.toLowerCase()]?.lotSize || orderBooks[strike]?.lotSize || 75}
          tickSize={orderBooks[strike]?.[type.toLowerCase()]?.tickSize || orderBooks[strike]?.tickSize || 0.05}
          bidPrice={orderBooks[strike]?.[type.toLowerCase()]?.bidPrice || (strike > 0 ? strike * 0.05 : 100)}
          askPrice={orderBooks[strike]?.[type.toLowerCase()]?.askPrice || (strike > 0 ? strike * 0.05 + 0.05 : 100.05)}
        />
      ))}
    </div>
  );
}

export default OrderBook;