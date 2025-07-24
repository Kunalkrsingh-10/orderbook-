
// import React, { useEffect, useState, useContext } from 'react';
// import { OrderBookContext } from '../App.jsx';
// import OrderBookTable from './OrderBookTable.jsx';

// function OrderBook() {
//   const { strikes, orderBooks, setOrderBooks, pendingOrders, setPendingOrders, orderBookType } = useContext(OrderBookContext);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const random = (min, max) => Math.random() * (max - min) + min;

//   const getOptionPrice = (strike, option_type, niftySpot, tickSize) => {
//     const distance = Math.abs(strike - niftySpot);
//     let base_price;
//     if (distance === 0) {
//       base_price = random(80, 120);
//     } else if (distance <= 50) {
//       base_price = random(40, 80);
//     } else if (distance <= 100) {
//       base_price = random(15, 40);
//     } else if (distance <= 200) {
//       base_price = random(5, 15);
//     } else {
//       base_price = random(0.5, 5);
//     }
//     const multiplier = random(0.8, 1.2);
//     return Math.max(tickSize * 10, base_price * multiplier);
//   };

//   const generateOrderBook = (strike, option_type, tickSize, lotSize, niftySpot) => {
//     const base_price = getOptionPrice(strike, option_type, niftySpot, tickSize);
//     const spread_percentage = random(0.02, 0.08);
//     const half_spread = base_price * spread_percentage / 2;
//     const bids = [];
//     const asks = [];
//     let totalBidQty = 0;
//     let totalAskQty = 0;

//     for (let depth = 0; depth < 10; depth++) {
//       const depth_factor = depth * 0.01;
//       let bid_price = base_price - half_spread - (base_price * depth_factor);
//       let ask_price = base_price + half_spread + (base_price * depth_factor);
//       const bid_qty = lotSize * randomChoice([1, 2, 3, 5]);
//       const ask_qty = lotSize * randomChoice([1, 2, 3, 5]);

//       bid_price = Math.max(tickSize, Math.round(bid_price / tickSize) * tickSize);
//       ask_price = Math.round(ask_price / tickSize) * tickSize;
//       totalBidQty += bid_qty;
//       totalAskQty += ask_qty;

//       bids.push([bid_price, bid_qty, `bid-${strike}-${option_type}-${depth}`, depth + 1]);
//       asks.push([ask_price, ask_qty, `ask-${strike}-${option_type}-${depth}`, depth + 1]);
//     }

//     bids.sort((a, b) => b[0] - a[0]);
//     asks.sort((a, b) => a[0] - b[0]);
//     return { bids, asks, totalBidQty, totalAskQty };
//   };

//   const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

//   useEffect(() => {
//     setLoading(true);
//     try {
//       setOrderBooks((prevOrderBooks) => {
//         const newOrderBooks = { ...prevOrderBooks };
//         strikes.forEach((strike) => {
//           if (!newOrderBooks[strike]) {
//             newOrderBooks[strike] = {
//               tickSize: newOrderBooks[strike]?.tickSize || 0.05,
//               lotSize: newOrderBooks[strike]?.lotSize || 75,
//               niftySpot: newOrderBooks[strike]?.niftySpot || 22550,
//               orderBookType
//             };
//           }
//           if (!newOrderBooks[strike].call && orderBookType === 'Call') {
//             newOrderBooks[strike].call = generateOrderBook(
//               strike,
//               'call',
//               newOrderBooks[strike].tickSize,
//               newOrderBooks[strike].lotSize,
//               newOrderBooks[strike].niftySpot
//             );
//           }
//           if (!newOrderBooks[strike].put && orderBookType === 'Put') {
//             newOrderBooks[strike].put = generateOrderBook(
//               strike,
//               'put',
//               newOrderBooks[strike].tickSize,
//               newOrderBooks[strike].lotSize,
//               newOrderBooks[strike].niftySpot
//             );
//           }
//           if (!newOrderBooks[strike].fut && orderBookType === 'Fut') {
//             newOrderBooks[strike].fut = generateOrderBook(
//               strike,
//               'fut',
//               newOrderBooks[strike].tickSize,
//               newOrderBooks[strike].lotSize,
//               newOrderBooks[strike].niftySpot
//             );
//           }
//         });
//         Object.keys(newOrderBooks).forEach((strike) => {
//           if (!strikes.includes(Number(strike))) {
//             delete newOrderBooks[strike];
//           }
//         });
//         return newOrderBooks;
//       });
//       setLoading(false);
//     } catch (err) {
//       console.error('Error generating order books:', err);
//       setError('Failed to generate order book data');
//       setLoading(false);
//     }
//   }, [strikes, orderBookType, setOrderBooks]);

//   useEffect(() => {
//     const decayInterval = setInterval(() => {
//       setOrderBooks((prev) => {
//         const updated = {};
//         Object.keys(prev).forEach((strike) => {
//           const { tickSize, lotSize, niftySpot } = prev[strike];
//           updated[strike] = { ...prev[strike] };
//           if (prev[strike].call) {
//             updated[strike].call = {
//               bids: prev[strike].call.bids.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               asks: prev[strike].call.asks.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               totalBidQty: prev[strike].call.bids.reduce((sum, [, qty]) => sum + qty, 0),
//               totalAskQty: prev[strike].call.asks.reduce((sum, [, qty]) => sum + qty, 0)
//             };
//           }
//           if (prev[strike].put) {
//             updated[strike].put = {
//               bids: prev[strike].put.bids.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               asks: prev[strike].put.asks.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               totalBidQty: prev[strike].put.bids.reduce((sum, [, qty]) => sum + qty, 0),
//               totalAskQty: prev[strike].put.asks.reduce((sum, [, qty]) => sum + qty, 0)
//             };
//           }
//           if (prev[strike].fut) {
//             updated[strike].fut = {
//               bids: prev[strike].fut.bids.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               asks: prev[strike].fut.asks.map(([price, qty, id, index]) => [
//                 Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
//                 qty,
//                 id,
//                 index
//               ]),
//               totalBidQty: prev[strike].fut.bids.reduce((sum, [, qty]) => sum + qty, 0),
//               totalAskQty: prev[strike].fut.asks.reduce((sum, [, qty]) => sum + qty, 0)
//             };
//           }
//         });
//         return updated;
//       });
//       setPendingOrders((prevPending) => {
//         const remainingPending = [];
//         const ordersToAdd = [];
//         prevPending.forEach((order) => {
//           const { strike, option_type, order_type, price, quantity, order_id } = order;
//           if (orderBooks[strike]?.[option_type]) {
//             const book = orderBooks[strike][option_type];
//             const prices = order_type === 'buy' ? book.bids.map(([p]) => p) : book.asks.map(([p]) => p);
//             const minPrice = Math.min(...prices);
//             const maxPrice = Math.max(...prices);
//             if (
//               (order_type === 'buy' && price >= minPrice) ||
//               (order_type === 'sell' && price <= maxPrice)
//             ) {
//               ordersToAdd.push(order);
//             } else {
//               remainingPending.push(order);
//             }
//           } else {
//             remainingPending.push(order);
//           }
//         });
//         if (ordersToAdd.length > 0) {
//           setOrderBooks((prev) => {
//             const updated = { ...prev };
//             ordersToAdd.forEach(({ strike, option_type, order_type, price, quantity, order_id }) => {
//               if (updated[strike]?.[option_type]) {
//                 const book = updated[strike][option_type];
//                 const field = order_type === 'buy' ? 'bids' : 'asks';
//                 let entries = [...book[field]];
//                 const existingIndex = entries.findIndex(([p]) => p === price);
//                 if (existingIndex !== -1) {
//                   entries[existingIndex][1] += quantity;
//                   entries[existingIndex][2] = `agg-${strike}-${option_type}-${Date.now()}`;
//                 } else {
//                   entries.push([price, quantity, order_id, entries.length + 1]);
//                 }
//                 entries.sort((a, b) => order_type === 'buy' ? b[0] - a[0] : a[0] - b[0]);
//                 updated[strike][option_type] = {
//                   ...book,
//                   [field]: entries.slice(0, 10),
//                   totalBidQty: field === 'bids' ? entries.reduce((sum, [, qty]) => sum + qty, 0) : book.totalBidQty,
//                   totalAskQty: field === 'asks' ? entries.reduce((sum, [, qty]) => sum + qty, 0) : book.totalAskQty
//                 };
//               }
//             });
//             return updated;
//           });
//         }
//         return remainingPending;
//       });
//     }, 60000);
//     return () => clearInterval(decayInterval);
//   }, [orderBooks, setOrderBooks, pendingOrders, setPendingOrders]);

//   const deleteTable = (strike, option_type) => {
//     setOrderBooks((prev) => {
//       const updated = { ...prev };
//       if (updated[strike]) {
//         delete updated[strike][option_type];
//         if (!updated[strike].call && !updated[strike].put && !updated[strike].fut) {
//           delete updated[strike];
//         }
//       }
//       return updated;
//     });
//     setPendingOrders((prev) => prev.filter(
//       (order) => !(order.strike === strike && order.option_type === option_type)
//     ));
//   };

//   if (loading) {
//     return <div>Loading order books...</div>;
//   }

//   if (error) {
//     return <div style={{ color: 'red' }}>Error: {error}</div>;
//   }

//   if (!strikes || strikes.length === 0) {
//     return <div>Enter strikes to generate order books</div>;
//   }

//   return (
//     <div className="order-book-container">
//       {strikes.map((strike) => (
//         <OrderBookTable
//           key={strike}
//           strike={strike}
//           callData={orderBooks[strike]?.call || null}
//           putData={orderBooks[strike]?.put || null}
//           futData={orderBooks[strike]?.fut || null}
//           setOrderBooks={setOrderBooks}
//           deleteTable={deleteTable}
//           lotSize={orderBooks[strike]?.lotSize || 75}
//           tickSize={orderBooks[strike]?.tickSize || 0.05}
//           niftySpot={orderBooks[strike]?.niftySpot || 22550}
//         />
//       ))}
//     </div>
//   );
// }

// export default OrderBook;

import React, { useEffect, useState, useContext } from 'react';
import { OrderBookContext } from '../App.jsx';
import OrderBookTable from './OrderBookTable.jsx';

function OrderBook() {
  const { strikes, orderBooks, setOrderBooks, pendingOrders, setPendingOrders, orderBookType, triggerOrderBookGeneration } = useContext(OrderBookContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const random = (min, max) => Math.random() * (max - min) + min;

  const getOptionPrice = (strike, option_type, niftySpot, tickSize) => {
    const distance = Math.abs(strike - niftySpot);
    let base_price;
    if (distance === 0) {
      base_price = random(80, 120);
    } else if (distance <= 50) {
      base_price = random(40, 80);
    } else if (distance <= 100) {
      base_price = random(15, 40);
    } else if (distance <= 200) {
      base_price = random(5, 15);
    } else {
      base_price = random(0.5, 5);
    }
    const multiplier = random(0.8, 1.2);
    return Math.max(tickSize * 10, base_price * multiplier);
  };

  const generateOrderBook = (strike, option_type, tickSize, lotSize, niftySpot) => {
    const base_price = getOptionPrice(strike, option_type, niftySpot, tickSize);
    const spread_percentage = random(0.02, 0.08);
    const half_spread = base_price * spread_percentage / 2;
    const bids = [];
    const asks = [];
    let totalBidQty = 0;
    let totalAskQty = 0;

    for (let depth = 0; depth < 10; depth++) {
      const depth_factor = depth * 0.01;
      let bid_price = base_price - half_spread - (base_price * depth_factor);
      let ask_price = base_price + half_spread + (base_price * depth_factor);
      const bid_qty = lotSize * randomChoice([1, 2, 3, 5]);
      const ask_qty = lotSize * randomChoice([1, 2, 3, 5]);

      bid_price = Math.max(tickSize, Math.round(bid_price / tickSize) * tickSize);
      ask_price = Math.round(ask_price / tickSize) * tickSize;
      totalBidQty += bid_qty;
      totalAskQty += ask_qty;

      bids.push([bid_price, bid_qty, `bid-${strike}-${option_type}-${depth}`, depth + 1]);
      asks.push([ask_price, ask_qty, `ask-${strike}-${option_type}-${depth}`, depth + 1]);
    }

    bids.sort((a, b) => b[0] - a[0]);
    asks.sort((a, b) => a[0] - b[0]);
    return { bids, asks, totalBidQty, totalAskQty };
  };

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  useEffect(() => {
    setLoading(true);
    try {
      setOrderBooks((prevOrderBooks) => {
        const newOrderBooks = { ...prevOrderBooks };
        strikes.forEach((strike) => {
          if (!newOrderBooks[strike]) {
            newOrderBooks[strike] = {
              tickSize: newOrderBooks[strike]?.tickSize || 0.05,
              lotSize: newOrderBooks[strike]?.lotSize || 75,
              niftySpot: newOrderBooks[strike]?.niftySpot || 22550,
              orderBookType
            };
          }
          if (!newOrderBooks[strike].call && orderBookType === 'Call') {
            newOrderBooks[strike].call = generateOrderBook(
              strike,
              'call',
              newOrderBooks[strike].tickSize,
              newOrderBooks[strike].lotSize,
              newOrderBooks[strike].niftySpot
            );
          }
          if (!newOrderBooks[strike].put && orderBookType === 'Put') {
            newOrderBooks[strike].put = generateOrderBook(
              strike,
              'put',
              newOrderBooks[strike].tickSize,
              newOrderBooks[strike].lotSize,
              newOrderBooks[strike].niftySpot
            );
          }
          if (!newOrderBooks[strike].fut && orderBookType === 'Fut') {
            newOrderBooks[strike].fut = generateOrderBook(
              strike,
              'fut',
              newOrderBooks[strike].tickSize,
              newOrderBooks[strike].lotSize,
              newOrderBooks[strike].niftySpot
            );
          }
        });
        Object.keys(newOrderBooks).forEach((strike) => {
          if (!strikes.includes(Number(strike))) {
            delete newOrderBooks[strike];
          }
        });
        return newOrderBooks;
      });
      setLoading(false);
    } catch (err) {
      console.error('Error generating order books:', err);
      setError('Failed to generate order book data');
      setLoading(false);
    }
  }, [strikes, triggerOrderBookGeneration, setOrderBooks]); // Depend on trigger instead of orderBookType

  useEffect(() => {
    const decayInterval = setInterval(() => {
      setOrderBooks((prev) => {
        const updated = {};
        Object.keys(prev).forEach((strike) => {
          const { tickSize, lotSize, niftySpot } = prev[strike];
          updated[strike] = { ...prev[strike] };
          if (prev[strike].call) {
            updated[strike].call = {
              bids: prev[strike].call.bids.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              asks: prev[strike].call.asks.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              totalBidQty: prev[strike].call.bids.reduce((sum, [, qty]) => sum + qty, 0),
              totalAskQty: prev[strike].call.asks.reduce((sum, [, qty]) => sum + qty, 0)
            };
          }
          if (prev[strike].put) {
            updated[strike].put = {
              bids: prev[strike].put.bids.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              asks: prev[strike].put.asks.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              totalBidQty: prev[strike].put.bids.reduce((sum, [, qty]) => sum + qty, 0),
              totalAskQty: prev[strike].put.asks.reduce((sum, [, qty]) => sum + qty, 0)
            };
          }
          if (prev[strike].fut) {
            updated[strike].fut = {
              bids: prev[strike].fut.bids.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              asks: prev[strike].fut.asks.map(([price, qty, id, index]) => [
                Math.max(tickSize, Math.round(price * 0.999 / tickSize) * tickSize),
                qty,
                id,
                index
              ]),
              totalBidQty: prev[strike].fut.bids.reduce((sum, [, qty]) => sum + qty, 0),
              totalAskQty: prev[strike].fut.asks.reduce((sum, [, qty]) => sum + qty, 0)
            };
          }
        });
        return updated;
      });
      setPendingOrders((prevPending) => {
        const remainingPending = [];
        const ordersToAdd = [];
        prevPending.forEach((order) => {
          const { strike, option_type, order_type, price, quantity, order_id } = order;
          if (orderBooks[strike]?.[option_type]) {
            const book = orderBooks[strike][option_type];
            const prices = order_type === 'buy' ? book.bids.map(([p]) => p) : book.asks.map(([p]) => p);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (
              (order_type === 'buy' && price >= minPrice) ||
              (order_type === 'sell' && price <= maxPrice)
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
                const existingIndex = entries.findIndex(([p]) => p === price);
                if (existingIndex !== -1) {
                  entries[existingIndex][1] += quantity;
                  entries[existingIndex][2] = `agg-${strike}-${option_type}-${Date.now()}`;
                } else {
                  entries.push([price, quantity, order_id, entries.length + 1]);
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
        return remainingPending;
      });
    }, 60000);
    return () => clearInterval(decayInterval);
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
      {strikes.map((strike) => (
        <OrderBookTable
          key={strike}
          strike={strike}
          callData={orderBooks[strike]?.call || null}
          putData={orderBooks[strike]?.put || null}
          futData={orderBooks[strike]?.fut || null}
          setOrderBooks={setOrderBooks}
          deleteTable={deleteTable}
          lotSize={orderBooks[strike]?.lotSize || 75}
          tickSize={orderBooks[strike]?.tickSize || 0.05}
          niftySpot={orderBooks[strike]?.niftySpot || 22550}
        />
      ))}
    </div>
  );
}

export default OrderBook;