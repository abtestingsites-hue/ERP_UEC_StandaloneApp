import React from 'react';
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, EmptyState } from '../components/ui';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ModulePlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  details?: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  title,
  description,
  icon,
  badge = 'Phase C Ready',
  details,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={title}
        description={description}
        badge={<Badge variant="info">{badge}</Badge>}
        actions={
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Command Center</span>
          </Link>
        }
      />

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={icon || <Layers className="w-6 h-6 text-emerald-400" />}
            title={`${title} Module`}
            description={
              details ||
              `${title} views, hooks, and services will be migrated from the monolithic ERP in Phase D. The standalone routing shell and authentication boundaries are verified.`
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
