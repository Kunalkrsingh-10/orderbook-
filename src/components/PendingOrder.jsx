import React, { useContext } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { OrderBookContext } from '../App.jsx';

ModuleRegistry.registerModules([AllCommunityModule]);

function PendingOrder() {
  const { pendingOrders, setPendingOrders, orderBooks, setOrderBooks, lotSize } = useContext(OrderBookContext);

  const formatQuantity = (params) => {
    const qty = params.value;
    if (!qty) return '';
    const lots = qty / lotSize;
    return `${qty} (${lots} lots)`;
  };

  const handleRemoveOrder = (order) => {
    setPendingOrders((prev) => prev.filter(
      (o) => o.order_id !== order.order_id
    ));
    console.log('Order deleted from pending:', order);
  };

  const columnDefs = [
    { headerName: 'Strike', field: 'strike', sortable: true, width: 100 },
    { headerName: 'Option Type', field: 'option_type', sortable: true, width: 120 },
    { headerName: 'Order Type', field: 'order_type', sortable: true, width: 120 },
    { headerName: 'Price', field: 'price', sortable: true, width: 100 },
    { headerName: 'Quantity', field: 'quantity', sortable: true, width: 120, valueFormatter: formatQuantity },
    { headerName: 'Action', field: 'action', width: 100, cellRenderer: (params) => (
      <button
        className="btn-small"
        onClick={() => handleRemoveOrder(params.data)}
      >
        Remove
      </button>
    )}
  ];

  const rowData = pendingOrders.map((order) => ({
    strike: order.strike,
    option_type: order.option_type,
    order_type: order.order_type,
    price: order.price,
    quantity: order.quantity,
    order_id: order.order_id
  }));

  return (
    <div className="pending-orders-section">
      <h3>My Pending Orders</h3>
      <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}

export default PendingOrder;