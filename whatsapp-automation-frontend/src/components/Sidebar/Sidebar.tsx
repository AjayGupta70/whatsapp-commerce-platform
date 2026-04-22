'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  ShoppingBag, 
  Users, 
  Settings, 
  PieChart, 
  Coffee,
  ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: <MessageSquare size={20} />, label: 'Shared Inbox', href: '/' },
    { icon: <ShoppingBag size={20} />, label: 'Orders', href: '/orders' },
    { icon: <PieChart size={20} />, label: 'Analytics', href: '/analytics' },
    { icon: <Users size={20} />, label: 'Customers', href: '/customers' },
    { icon: <Coffee size={20} />, label: 'Catalog', href: '/catalog' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Coffee className={styles.gold} />
        </div>
        <div>
          <h2 className={styles.logoText}>Golden Cafe</h2>
          <p className={styles.logoSubtext}>Commerce Engine</p>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>MENU</div>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={index} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
              {isActive && <ChevronRight size={14} className={styles.activeArrow} />}
            </Link>
          );
        })}
      </nav>


      <div className={styles.footer}>
        <div className={styles.navItem}>
          <span className={styles.icon}><Settings size={20} /></span>
          <span className={styles.label}>Settings</span>
        </div>
        <div className={styles.profile}>
          <div className={styles.avatar}>AG</div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>Ajay Gupta</p>
            <p className={styles.profileRole}>Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
