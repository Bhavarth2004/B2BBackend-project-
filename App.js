import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Package, Plus, BarChart3, RefreshCcw } from 'lucide-react';

const API_BASE = "http://localhost:8086/api"; 

function App() {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    sku: '', 
    name: '', 
    price: '', 
    lowStockThreshold: '', 
    initialQty: 0, 
    warehouseId: 1 
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    fetchProducts();
    fetchAlerts();
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      console.log("Full Product Data:", res.data); // DEBUG: Check your browser console!
      setProducts(res.data);
    } catch (err) {
      console.error("Backend unreachable. Check server port.");
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/1/alerts/low-stock`);
      const alertList = Array.isArray(res.data) ? res.data : (res.data.alerts || []);
      setAlerts(alertList);
    } catch (err) {
      console.error("Could not fetch alerts.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/products?initialQty=${formData.initialQty}&warehouseId=${formData.warehouseId}`, {
        sku: formData.sku,
        name: formData.name,
        price: parseFloat(formData.price),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      });
      
      alert("✅ Product Added Successfully!");
      setFormData({ sku: '', name: '', price: '', lowStockThreshold: '', initialQty: 0, warehouseId: 1 });
      refreshData(); 
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Check if SKU already exists";
      alert("❌ Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (sku, currentQty) => {
    // Convert to number to ensure "0" (string) is handled correctly
    const qty = Number(currentQty);

    // 1. If the quantity is null or undefined, we don't know the status yet
    if (currentQty === undefined || currentQty === null) {
      return <span style={{...styles.statusBadge, backgroundColor: '#e2e8f0', color: '#475569'}}>Loading...</span>;
    }

    // 2. Absolute Zero check
    if (qty === 0) {
      return (
        <span style={{...styles.statusBadge, backgroundColor: '#fecaca', color: '#991b1b'}}>
          Out of Stock
        </span>
      );
    }

    // 3. Low Stock Alert check
    const isLow = alerts.some(a => a.sku === sku);
    if (isLow) {
      return (
        <span style={{...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b'}}>
          Low Stock
        </span>
      );
    }

    // 4. Normal Stock
    return <span style={styles.statusBadge}>In Stock</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      
      <div style={{ width: '350px', backgroundColor: '#ffffff', padding: '30px', borderRight: '1px solid #e2e8f0' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
          <Plus size={20} color="#2563eb"/> New Product
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Unique SKU" value={formData.sku} required onChange={e => setFormData({...formData, sku: e.target.value})} style={styles.input} />
          <input type="text" placeholder="Product Name" value={formData.name} required onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} />
          <input type="number" step="0.01" placeholder="Price ($)" value={formData.price} required onChange={e => setFormData({...formData, price: e.target.value})} style={styles.input} />
          <input type="number" placeholder="Alert Threshold" value={formData.lowStockThreshold} required onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} style={styles.input} />
          <input type="number" placeholder="Initial Quantity" value={formData.initialQty} required onChange={e => setFormData({...formData, initialQty: e.target.value})} style={styles.input} />
          
          <button type="submit" disabled={loading} style={{...styles.button, backgroundColor: loading ? '#94a3b8' : '#2563eb'}}>
            {loading ? 'Adding...' : 'Create Product'}
          </button>
        </form>
      </div>

      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Inventory Dashboard</h1>
          <button onClick={refreshData} style={styles.refreshBtn}><RefreshCcw size={16}/> Refresh</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <StatCard icon={<Package color="#3b82f6"/>} label="Total SKU" value={products.length} />
            <StatCard icon={<AlertTriangle color="#ef4444"/>} label="Active Alerts" value={alerts.length} />
            <StatCard icon={<BarChart3 color="#10b981"/>} label="Location" value="Pune-Main" />
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead style={{ backgroundColor: '#f1f5f9' }}>
              <tr>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>NAME</th>
                <th style={styles.th}>PRICE</th>
                <th style={styles.th}>QTY</th>
                <th style={styles.th}>THRESHOLD</th>
                <th style={styles.th}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                // Try every possible field name where the quantity might be stored
                const currentQty = p.quantity ?? p.inventory?.quantity ?? p.stockQty;

                return (
                  <tr key={p.id}>
                    <td style={styles.td}><strong>{p.sku}</strong></td>
                    <td style={styles.td}>{p.name}</td>
                    <td style={styles.td}>${p.price?.toFixed(2)}</td>
                    <td style={styles.td}>{currentQty !== undefined ? currentQty : "???"}</td>
                    <td style={styles.td}>{p.lowStockThreshold}</td>
                    <td style={styles.td}>
                      {getStatusBadge(p.sku, currentQty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value }) => (
  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', width: '30%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{icon} <span style={{ color: '#64748b' }}>{label}</span></div>
    <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>{value}</div>
  </div>
);

const styles = {
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' },
  button: { padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '15px 20px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' },
  td: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '600' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }
};

export default App;