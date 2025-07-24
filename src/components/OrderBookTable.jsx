

// import React from 'react';
// import { AgGridReact } from 'ag-grid-react';
// import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';

// ModuleRegistry.registerModules([AllCommunityModule]);

// function OrderBookTable({ strike, callData, putData,futData, setOrderBooks, deleteTable, lotSize, tickSize, niftySpot }) {
//   const formatQuantity = (params) => {
//     const qty = params.value;
//     if (!qty) return '';
//     const lots = qty / lotSize;
//     return `${qty} (${lots} )`;
//   };

//   const columnDefs = [
//     { 
//       headerName: 's.no', 
//       field: 'index', 
//       sortable: true, 
//       width: 30, 
//       valueFormatter: formatQuantity,
//       cellClass: 'buy-side'
//     },
//     { 
//       headerName: 'Bid Qty', 
//       field: 'bidQty', 
//       sortable: true, 
//       width: 90, 
//       valueFormatter: formatQuantity,
//       cellClass: 'buy-side'
//     },
//     { 
//       headerName: 'Bid Price', 
//       field: 'bidPrice', 
//       sortable: true, 
//       width: 90,
//       cellClass: 'buy-side'
//     },
//     { 
//       headerName: 'Ask Price', 
//       field: 'askPrice', 
//       sortable: true, 
//       width: 90,
//       cellClass: 'sell-side'
//     },
//     { 
//       headerName: 'Ask Qty', 
//       field: 'askQty', 
//       sortable: true, 
//       width: 90, 
//       valueFormatter: formatQuantity,
//       cellClass: 'sell-side'
//     }
//   ];
//   // };
//   const handleCellClick = (event, option_type) => {
//   const order_id = `order-${strike}-${option_type}-${Date.now()}`;
//   const clickedPrice = event.value;
  
//   // Get current order book data
//   const currentData = option_type === 'call' ? callData : 
//                      option_type === 'put' ? putData : futData;
  
//   if (!currentData) return;
  
//   const order = {
//     strike,
//     option_type,
//     price: clickedPrice,
//     quantity: lotSize,
//     order_id
//   };

//   if (event.column.colId === 'bidPrice') {
//     // For buy orders: price should be <= highest bid and >= lowest ask
//     const highestBid = currentData.bids[0]?.[0] || 0;
//     const lowestAsk = currentData.asks[currentData.asks.length - 1]?.[0] || Infinity;
    
//     if (clickedPrice <= highestBid && clickedPrice >= lowestAsk) {
//       order.order_type = 'buy';
//       // Add to order book logic...
//       setOrderBooks((prev) => {
//         const book = prev[strike][option_type];
//         const existingIndex = book.bids.findIndex(([p]) => p === clickedPrice);
//         let newBids = [...book.bids];
//         if (existingIndex !== -1) {
//           newBids[existingIndex][1] += lotSize;
//           newBids[existingIndex][2] = `agg-${strike}-${option_type}-${Date.now()}`;
//         } else {
//           newBids.push([clickedPrice, lotSize, order_id, newBids.length + 1]);
//         }
//         newBids.sort((a, b) => b[0] - a[0]);
        
//         // Recalculate total
//         const totalBidQty = newBids.reduce((sum, [, qty]) => sum + qty, 0);
        
//         return {
//           ...prev,
//           [strike]: {
//             ...prev[strike],
//             [option_type]: { 
//               ...book, 
//               bids: newBids.slice(0, 10),
//               totalBidQty
//             }
//           }
//         };
//       });
//     } else {
//       console.log('Order rejected: Price not within valid range');
//       return;
//     }
//   } else if (event.column.colId === 'askPrice') {
//     // For sell orders: price should be >= lowest ask and <= highest bid
//     const lowestAsk = currentData.asks[0]?.[0] || Infinity;
//     const highestBid = currentData.bids[currentData.bids.length - 1]?.[0] || 0;
    
//     if (clickedPrice >= lowestAsk && clickedPrice <= highestBid) {
//       order.order_type = 'sell';
//       // Add to order book logic...
//       setOrderBooks((prev) => {
//         const book = prev[strike][option_type];
//         const existingIndex = book.asks.findIndex(([p]) => p === clickedPrice);
//         let newAsks = [...book.asks];
//         if (existingIndex !== -1) {
//           newAsks[existingIndex][1] += lotSize;
//           newAsks[existingIndex][2] = `agg-${strike}-${option_type}-${Date.now()}`;
//         } else {
//           newAsks.push([clickedPrice, lotSize, order_id, newAsks.length + 1]);
//         }
//         newAsks.sort((a, b) => a[0] - b[0]);
        
//         // Recalculate total
//         const totalAskQty = newAsks.reduce((sum, [, qty]) => sum + qty, 0);
        
//         return {
//           ...prev,
//           [strike]: {
//             ...prev[strike],
//             [option_type]: { 
//               ...book, 
//               asks: newAsks.slice(0, 10),
//               totalAskQty
//             }
//           }
//         };
//       });
//     } else {
//       console.log('Order rejected: Price not within valid range');
//       return;
//     }
//   }
//   console.log('Order placed:', order);
// };
// const generateRowData = (data) => {
//   const rowData = data.bids.map((bid, i) => ({
//     index: i + 1,
//     bidQty: bid[1],
//     bidPrice: bid[0],
//     askPrice: data.asks[i]?.[0] || '',
//     askQty: data.asks[i]?.[1] || ''
//   }));
  
//   // Add total row
//   rowData.push({
//     index: 'Total',
//     bidQty: data.totalBidQty || data.bids.reduce((sum, [, qty]) => sum + qty, 0),
//     bidPrice: '',
//     askPrice: '',
//     askQty: data.totalAskQty || data.asks.reduce((sum, [, qty]) => sum + qty, 0)
//   });
  
//   return rowData;
// };
//   return (
//     <div className="strike-section">
//       {callData && (
//         <div className="table-card">
//           <div className="table-header">
//             <h3>Strike: {strike} Call (Tick: {tickSize}, Lot: {lotSize})</h3>
//             <button
//               className="close-button"
//               onClick={() => deleteTable(strike, 'call')}
//             >
//               ×
//             </button>
//           </div>
//           <div className="ag-theme-alpine" style={{ height: '300px', width: '360px' }}>
//             <AgGridReact
//               columnDefs={columnDefs}
//               rowData={generateRowData(callData)}
//               domLayout="autoHeight"
//               onCellClicked={(event) => handleCellClick(event, 'call')}
//             />
//           </div>
//         </div>
//       )}
//       {putData && (
//         <div className="table-card">
//           <div className="table-header">
//             <h3>Strike: {strike} Put (Tick: {tickSize}, Lot: {lotSize})</h3>
//             <button
//               className="close-button"
//               onClick={() => deleteTable(strike, 'put')}
//             >
//               ×
//             </button>
//           </div>
//           <div className="ag-theme-alpine" style={{ height: '300px', width: '360px' }}>
//             <AgGridReact
//               columnDefs={columnDefs}
//               rowData={generateRowData(putData)}
//               domLayout="autoHeight"
//               onCellClicked={(event) => handleCellClick(event, 'put')}
//             />
//           </div>
//         </div>
//       )}
//       {futData && (
//       <div className="table-card">
//         <div className="table-header">
//           <h3>FUT (Tick: {tickSize}, Lot: {lotSize})</h3>
//           <button
//             className="close-button"
//             onClick={() => deleteTable(strike, 'fut')}
//           >
//             ×
//           </button>
//         </div>
//         <div className="ag-theme-alpine" style={{ height: '350px', width: '400px' }}>
//           <AgGridReact
//             columnDefs={columnDefs}
//             rowData={generateRowData(futData)}
//             domLayout="autoHeight"
//             onCellClicked={(event) => handleCellClick(event, 'fut')}
//           />
//         </div>
//       </div>
//     )}
//     </div>
//   );
// }

// export default OrderBookTable;

import React, { useContext } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { OrderBookContext } from '../App.jsx';

ModuleRegistry.registerModules([AllCommunityModule]);

function OrderBookTable({ strike, callData, putData, futData, setOrderBooks, deleteTable, lotSize, tickSize, niftySpot }) {
  const { setPendingOrders } = useContext(OrderBookContext);

  const formatQuantity = (params) => {
    const qty = params.value;
    if (!qty) return '';
    const lots = qty / lotSize;
    return `${qty} (${lots})`;
  };

  const formatPrice = (params) => {
    return params.value || params.value === 0 ? params.value : '';
  };

  const columnDefs = [
    { 
      headerName: 's.no', 
      field: 'index', 
      sortable: true, 
      width: 80, 
      cellClass: 'buy-side'
    },
    { 
      headerName: 'Bid Qty', 
      field: 'bidQty', 
      sortable: true, 
      width: 120, 
      valueFormatter: formatQuantity,
      cellClass: 'buy-side'
    },
    { 
      headerName: 'Bid Price', 
      field: 'bidPrice', 
      sortable: true, 
      width: 100,
      valueFormatter: formatPrice,
      cellClass: 'buy-side clickable'
    },
    { 
      headerName: 'Ask Price', 
      field: 'askPrice', 
      sortable: true, 
      width: 100,
      valueFormatter: formatPrice,
      cellClass: 'sell-side clickable'
    },
    { 
      headerName: 'Ask Qty', 
      field: 'askQty', 
      sortable: true, 
      width: 120, 
      valueFormatter: formatQuantity,
      cellClass: 'sell-side'
    }
  ];

  const handleCellClick = (event, option_type) => {
    const order_id = `order-${strike}-${option_type}-${Date.now()}`;
    const clickedPrice = event.value;
    if (!clickedPrice) return; // Skip if price is empty (e.g., total row)

    const currentData = option_type === 'call' ? callData : 
                       option_type === 'put' ? putData : futData;
    if (!currentData) return;

    const order = {
      strike,
      option_type,
      price: clickedPrice,
      quantity: lotSize,
      order_id
    };

    if (event.column.colId === 'bidPrice') {
      // For buy orders: price should be <= highest bid and >= lowest ask
      const highestBid = currentData.bids[0]?.[0] || 0;
      const lowestAsk = currentData.asks[currentData.asks.length - 1]?.[0] || Infinity;
      
      if (clickedPrice <= highestBid && clickedPrice >= lowestAsk) {
        order.order_type = 'buy';
        setPendingOrders((prev) => {
          const newPending = [...prev, order];
          console.log('Buy order queued:', order, 'Pending orders:', newPending);
          return newPending;
        });
      } else {
        console.log('Order rejected: Buy price not within valid range');
        return;
      }
    } else if (event.column.colId === 'askPrice') {
      // For sell orders: price should be >= lowest ask and <= highest bid
      const lowestAsk = currentData.asks[0]?.[0] || Infinity;
      const highestBid = currentData.bids[currentData.bids.length - 1]?.[0] || 0;
      
      if (clickedPrice >= lowestAsk && clickedPrice <= highestBid) {
        order.order_type = 'sell';
        setPendingOrders((prev) => {
          const newPending = [...prev, order];
          console.log('Sell order queued:', order, 'Pending orders:', newPending);
          return newPending;
        });
      } else {
        console.log('Order rejected: Sell price not within valid range');
        return;
      }
    }
  };

  const generateRowData = (data) => {
    const rowData = data.bids.map((bid, i) => ({
      index: bid[3] || i + 1, // Use index from bids array
      bidQty: bid[1],
      bidPrice: bid[0],
      askPrice: data.asks[i]?.[0] || '',
      askQty: data.asks[i]?.[1] || ''
    }));
    
    rowData.push({
      index: 'Total',
      bidQty: data.totalBidQty || data.bids.reduce((sum, [, qty]) => sum + qty, 0),
      bidPrice: null, // Use null for blank cell
      askPrice: null, // Use null for blank cell
      askQty: data.totalAskQty || data.asks.reduce((sum, [, qty]) => sum + qty, 0)
    });
    
    return rowData;
  };

  return (
    <div className="strike-section">
      {callData && (
        <div className="table-card">
          <div className="table-header">
            <h3>Strike: {strike} Call (Tick: {tickSize}, Lot: {lotSize})</h3>
            <button
              className="close-button"
              onClick={() => deleteTable(strike, 'call')}
            >
              ×
            </button>
          </div>
          <div className="ag-theme-alpine" style={{ height: '300px', width: '360px' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={generateRowData(callData)}
              domLayout="autoHeight"
              onCellClicked={(event) => handleCellClick(event, 'call')}
            />
          </div>
        </div>
      )}
      {putData && (
        <div className="table-card">
          <div className="table-header">
            <h3>Strike: {strike} Put (Tick: {tickSize}, Lot: {lotSize})</h3>
            <button
              className="close-button"
              onClick={() => deleteTable(strike, 'put')}
            >
              ×
            </button>
          </div>
          <div className="ag-theme-alpine" style={{ height: '300px', width: '380px' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={generateRowData(putData)}
              domLayout="autoHeight"
              onCellClicked={(event) => handleCellClick(event, 'put')}
            />
          </div>
        </div>
      )}
      {futData && (
        <div className="table-card">
          <div className="table-header">
            <h3>FUT (Tick: {tickSize}, Lot: {lotSize})</h3>
            <button
              className="close-button"
              onClick={() => deleteTable(strike, 'fut')}
            >
              ×
            </button>
          </div>
          <div className="ag-theme-alpine" style={{ height: '300px', width: '380px' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={generateRowData(futData)}
              domLayout="autoHeight"
              onCellClicked={(event) => handleCellClick(event, 'fut')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderBookTable;