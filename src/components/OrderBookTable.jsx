

import React, { useContext, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { OrderBookContext } from '../App.jsx';

ModuleRegistry.registerModules([AllCommunityModule]);

function OrderBookTable({ strike, callData, putData, futData, setOrderBooks, deleteTable, lotSize, tickSize }) {
  const { setPendingOrderPrices } = useContext(OrderBookContext);
  const gridRef = useRef();

  const formatQuantity = (params) => {
    const qty = params.value;
    if (!qty) return '';
    const lots = qty / lotSize;
    return `${qty} (${lots})`;
  };

  const formatPrice = (params) => {
    return params.value || params.value === 0 ? Number(params.value).toFixed(2) : '';
  };

  const columnDefs = [
    { 
      headerName: '', 
      field: 'index', 
      sortable: true, 
      width: 30, 
      cellClass: 'buy-side'
    },
    { 
      headerName: 'Bid Qty', 
      field: 'bidQty', 
      sortable: true, 
      width: 90, 
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
      width: 90, 
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

    // Validate price is a multiple of tickSize
    if (clickedPrice % tickSize !== 0) {
      console.log('Order rejected: Price is not a multiple of tick size');
      return;
    }

    const order = {
      strike,
      option_type,
      price: clickedPrice,
      quantity: lotSize,
      order_id
    };

    // Get bid-ask range
    const highestBid = currentData.bids[0]?.[0] || 0;
    const lowestAsk = currentData.asks[0]?.[0] || Infinity;

    if (event.column.colId === 'bidPrice') {
      // Buy order: price must be <= highestBid and >= lowestAsk
      if (clickedPrice <= highestBid && clickedPrice >= lowestAsk) {
        order.order_type = 'buy';
        setPendingOrderPrices((prev) => {
          const newPending = [...prev, order];
          console.log('Buy order queued:', order, 'Pending orders:', newPending);
          return newPending;
        });
      } else {
        console.log('Order rejected: Buy price not within valid range');
        return;
      }
    } else if (event.column.colId === 'askPrice') {
      // Sell order: price must be >= lowestAsk and <= highestBid
      if (clickedPrice >= lowestAsk && clickedPrice <= highestBid) {
        order.order_type = 'sell';
        setPendingOrderPrices((prev) => {
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
    if (!data || !data.bids || !data.asks) {
      console.log('Invalid data for generateRowData:', data);
      return [];
    }
    const maxLength = Math.max(data.bids.length, data.asks.length, 10);
    const rowData = Array.from({ length: maxLength }, (_, i) => ({
      index: i + 1,
      bidQty: data.bids[i]?.[1] || '',
      bidPrice: data.bids[i]?.[0] || '',
      askPrice: data.asks[i]?.[0] || '',
      askQty: data.asks[i]?.[1] || ''
    }));

    rowData.push({
      index: 'Total',
      bidQty: data.totalBidQty || data.bids.reduce((sum, [, qty]) => sum + qty, 0),
      bidPrice: null,
      askPrice: null,
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
          <div className="ag-theme-alpine" style={{ height: '300px', width: '410px' }}>
            <AgGridReact
              ref={gridRef}
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
          <div className="ag-theme-alpine" style={{ height: '300px', width: '410px' }}>
            <AgGridReact
              ref={gridRef}
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
          <div className="ag-theme-alpine" style={{ height: '300px', width: '410px' }}>
            <AgGridReact
              ref={gridRef}
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