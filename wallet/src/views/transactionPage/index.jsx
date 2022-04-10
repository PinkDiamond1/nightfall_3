import React from 'react';
import Header from '@Components/Header/header.jsx';
import SideBar from '@Components/SideBar/index.jsx';
import Transactions from '@Components/Transactions/index.jsx';
import styles from '../../styles/transactionPage.module.scss';

export default function TransactionPage() {
  return (
    <div>
      <Header />
      <div className={styles.bridgeComponent}>
        <div className={styles.bridgeComponent__left}>
          <SideBar />
        </div>
        <div className={styles.bridgeComponent__right}>
          <div className={styles.blueBack}>
            <div style={{ padding: '32px 80px' }}>
              <div
                className={styles.headerH2}
                style={{
                  fontWeight: '700',
                  fontSize: '36px',
                  lineHeight: '44px',
                  letterSpacing: '-.01em',
                }}
              >
                Transactions
              </div>
              <div>
                <Transactions />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
