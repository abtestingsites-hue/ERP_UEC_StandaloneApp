import React from 'react';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams as useReactSearchParams } from 'react-router-dom';

export function Link({ href, to, children, className, ...props }: any) {
  const target = href || to || '';
  // If target begins with /call-center, /leads, etc., prefix with /crm
  let mappedTarget = target;
  if (mappedTarget && mappedTarget.startsWith('/') && !mappedTarget.startsWith('/crm') && !mappedTarget.startsWith('/login') && !mappedTarget.startsWith('/portal')) {
    mappedTarget = '/crm' + (mappedTarget === '/' ? '' : mappedTarget);
  }
  return (
    <RouterLink to={mappedTarget} className={className} {...props}>
      {children}
    </RouterLink>
  );
}

export default Link;

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => {
      let mapped = url;
      if (mapped.startsWith('/') && !mapped.startsWith('/crm') && !mapped.startsWith('/login') && !mapped.startsWith('/portal')) {
        mapped = '/crm' + (mapped === '/' ? '' : mapped);
      }
      navigate(mapped);
    },
    replace: (url: string) => {
      let mapped = url;
      if (mapped.startsWith('/') && !mapped.startsWith('/crm') && !mapped.startsWith('/login') && !mapped.startsWith('/portal')) {
        mapped = '/crm' + (mapped === '/' ? '' : mapped);
      }
      navigate(mapped, { replace: true });
    },
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  const location = useLocation();
  // Strip '/crm' prefix if present so CRM components match their internal routes (/call-center, /leads, etc.)
  const p = location.pathname;
  if (p === '/crm' || p === '/crm/') return '/dashboard';
  if (p.startsWith('/crm/')) return p.replace('/crm', '');
  return p;
}

export function useSearchParams() {
  const [params] = useReactSearchParams();
  return params;
}

export function redirect(url: string) {
  if (typeof window !== 'undefined') {
    let mapped = url;
    if (mapped.startsWith('/') && !mapped.startsWith('/crm') && !mapped.startsWith('/login') && !mapped.startsWith('/portal')) {
      mapped = '/crm' + (mapped === '/' ? '' : mapped);
    }
    window.location.href = mapped;
  }
}
