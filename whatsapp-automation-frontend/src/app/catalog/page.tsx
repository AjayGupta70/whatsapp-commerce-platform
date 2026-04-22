'use client';

import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Coffee,
  RefreshCw
} from 'lucide-react';
import styles from './page.module.css';
import { useState, useEffect } from 'react';
import { API } from '@/services/api';

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await API.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className={styles.catalogContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <h1>Catalog Management</h1>
          <p>Manage your product inventory and pricing</p>
        </div>
        <button className={styles.addBtn}>
          <Plus size={18} /> Add New Product
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input type="text" placeholder="Search products..." />
        </div>
        <div className={styles.actions}>
          <button onClick={fetchProducts} className={styles.toolBtn}><RefreshCw size={18} /> Sync</button>
          <button className={styles.toolBtn}><Filter size={18} /> Filters</button>
        </div>
      </div>

      <main className={styles.grid}>
        {loading ? (
            <div className={styles.loading}>Loading catalog...</div>
        ) : products.length === 0 ? (
            <div className={styles.emptyState}>No products found. Seed your catalog first!</div>
        ) : (
            products.map(product => (
            <div key={product.id} className={styles.productCard}>
                <div className={styles.imagePlaceholder}>
                    <Coffee size={40} color="var(--accent-gold)" />
                    <span className={styles.categoryBadge}>{product.category?.name || 'General'}</span>
                </div>
                <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <h3>{product.name}</h3>
                    <button className={styles.moreBtn}><MoreVertical size={16} /></button>
                </div>
                <div className={styles.priceRow}>
                    <span className={styles.price}>₹{product.price}</span>
                    <span className={`${styles.status} ${(product.inventory?.stock || 0) <= 0 ? styles.outofstock : (product.inventory?.stock || 0) < 10 ? styles.lowstock : styles.active}`}>
                    {(product.inventory?.stock || 0) <= 0 ? 'Out of Stock' : (product.inventory?.stock || 0) < 10 ? 'Low Stock' : 'Active'}
                    </span>
                </div>
                <div className={styles.stockInfo}>
                    <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${Math.min(product.inventory?.stock || 0, 50) * 2}%`, backgroundColor: (product.inventory?.stock || 0) < 10 ? '#ef4444' : '#10b981' }}
                    ></div>
                    </div>
                    <span>{product.inventory?.stock || 0} items left</span>
                </div>

                <div className={styles.cardActions}>
                    <button className={styles.editBtn}><Edit2 size={14} /> Edit</button>
                    <button className={styles.deleteBtn}><Trash2 size={14} /></button>
                </div>
                </div>
            </div>
            ))
        )}
      </main>
    </div>
  );
}

