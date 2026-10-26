import React from 'react';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams as useReactSearchParams } from 'react-router-dom';

function resolveTargetUrl(target: string, currentPath: string): string {
  if (!target || !target.startsWith('/') || target === '/' || target.startsWith('/login') || target.startsWith('/portal')) {
    return target;
  }
  const isAgentMode = currentPath.startsWith('/crm/agent') || currentPath.startsWith('/agent');
  if (isAgentMode) {
    if (target.startsWith('/crm/agent')) return target;
    const clean = target.replace(/^\/crm/, '').replace(/^\/agent/, '');
    return `/crm/agent${clean.startsWith('/') ? clean : `/${clean}`}`;
  }
  if (!target.startsWith('/crm')) {
    return '/crm' + target;
  }
  return target;
}

export function Link({ href, to, children, className, ...props }: any) {
  const location = useLocation();
  const target = href || to || '';
  const mappedTarget = resolveTargetUrl(target, location.pathname);
  return (
    <RouterLink to={mappedTarget} className={className} {...props}>
      {children}
    </RouterLink>
  );
}

export default Link;

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return React.useMemo(
    () => ({
      push: (url: string) => {
        const mapped = resolveTargetUrl(url, currentPath);
        navigate(mapped);
      },
      replace: (url: string) => {
        const mapped = resolveTargetUrl(url, currentPath);
        navigate(mapped, { replace: true });
      },
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate, currentPath]
  );
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
