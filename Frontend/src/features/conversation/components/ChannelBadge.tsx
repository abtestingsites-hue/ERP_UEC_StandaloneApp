import { Mail, MessageSquare, Phone } from 'lucide-react'
import { cn } from '../../../lib/utils'

export const getChannelMeta = (channel?: string) => {
    const normalized = String(channel || 'whatsapp').trim().toLowerCase()

    if (normalized === 'email') {
        return {
            value: 'email',
            label: 'Email',
            badgeClassName: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200',
            dotClassName: 'bg-primary-500',
            surfaceClassName: 'border-primary-200/80 bg-primary-50/80 dark:border-primary-500/20 dark:bg-primary-500/5',
            accentClassName: 'text-primary-600 dark:text-primary-300'
        }
    }

    if (normalized === 'internal') {
        return {
            value: 'internal',
            label: 'Internal',
            badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-200',
            dotClassName: 'bg-slate-500',
            surfaceClassName: 'border-slate-200/80 bg-slate-50/80 dark:border-slate-500/20 dark:bg-slate-500/5',
            accentClassName: 'text-slate-600 dark:text-slate-300'
        }
    }

    if (normalized === 'call') {
        return {
            value: 'call',
            label: 'Call',
            badgeClassName: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200',
            dotClassName: 'bg-primary-500',
            surfaceClassName: 'border-primary-200/80 bg-primary-50/70 dark:border-primary-500/20 dark:bg-primary-500/5',
            accentClassName: 'text-primary-600 dark:text-primary-300'
        }
    }

    if (normalized === 'sms') {
        return {
            value: 'sms',
            label: 'SMS',
            badgeClassName: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200',
            dotClassName: 'bg-primary-500',
            surfaceClassName: 'border-primary-200/80 bg-primary-50/70 dark:border-primary-500/20 dark:bg-primary-500/5',
            accentClassName: 'text-primary-600 dark:text-primary-300'
        }
    }

    return {
        value: 'whatsapp',
        label: 'WhatsApp',
        badgeClassName: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200',
        dotClassName: 'bg-primary-500',
        surfaceClassName: 'border-primary-200/80 bg-primary-50/70 dark:border-primary-500/20 dark:bg-primary-500/5',
        accentClassName: 'text-primary-600 dark:text-primary-300'
    }
}

type ChannelBadgeProps = {
    channel?: string
    className?: string
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
    const meta = getChannelMeta(channel)

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                meta.badgeClassName,
                className
            )}
        >
            {meta.value === 'email' ? (
                <Mail className="h-3 w-3" />
            ) : meta.value === 'call' ? (
                <Phone className="h-3 w-3" />
            ) : meta.value === 'sms' ? (
                <MessageSquare className="h-3 w-3" />
            ) : (
                <span className={cn('h-2 w-2 rounded-full', meta.dotClassName)} />
            )}
            <span>{meta.label}</span>
        </span>
    )
}
