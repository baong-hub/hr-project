import styles from './Footer.module.scss';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} HIS - Hệ thống quản lý bệnh viện. All rights reserved.</p>
    </footer>
  );
};
