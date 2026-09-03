import { useEffect } from 'react';

export function useDocumentTitle(pageTitle: string, moduleName?: string) {
  useEffect(() => {
    const baseTitle = 'HR';
    if (pageTitle) {
      const suffix = moduleName ? ` - ${moduleName}` : '';
      document.title = `${pageTitle}${suffix} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [pageTitle, moduleName]);
}
