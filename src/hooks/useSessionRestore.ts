import { useEffect, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { investorApi } from '../api/generated/investorApi';
import { setAuthenticatedUser, logoutAction } from '../store/authSlice';
import { secureSession } from '../utils/secureSession';

export const useSessionRestore = () => {
  const dispatch = useAppDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await secureSession.getRefreshToken();
        if (!token) {
          dispatch(logoutAction());
          return;
        }
        const user = await dispatch(
          investorApi.endpoints.getAuthMe.initiate(undefined)
        ).unwrap();
        if (isMounted && user) {
          dispatch(
            setAuthenticatedUser({
              id: (user as any).id,
              email: (user as any).email,
              role: (user as any).role || 'INVESTOR',
              fullName: (user as any).fullName,
              investorRfid: (user as any).investorRfid,
            })
          );
        }
      } catch {
        if (isMounted) {
          dispatch(logoutAction());
        }
      } finally {
        if (isMounted) setIsRestoring(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return { isRestoring };
};
