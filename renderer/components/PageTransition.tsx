import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const router = useRouter();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeOut');

  useEffect(() => {
    setTransitionStage('fadeIn');
  }, []);

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fadeOut');
      
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, 400); // This should match the CSS animation time
      
      return () => clearTimeout(timeout);
    }
  }, [children, displayChildren]);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setTransitionStage('fadeOut');
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router]);

  return (
    <div className={`transition-wrapper ${transitionStage}`}>
      {displayChildren}
    </div>
  );
};

export default PageTransition;
