import { useEffect, useState } from 'react';
import { loadingService } from '../../../core/services/loading.service';
import styles from './TopProgressBar.module.scss';

export const TopProgressBar = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingService.subscribe((loading) => {
      setIsLoading(loading);
    });
    return () => unsubscribe();
  }, []);

  if (!isLoading) return null;

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBar}></div>
    </div>
  );
};
