'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { markAllNotificationsRead, markNotificationRead } from '@/app/actions/notifications'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean | null
  created_at: string
}

interface NotificationBellProps {
  userId: string
  initialNotifications: Notification[]
}

export function NotificationBell({ userId, initialNotifications }: NotificationBellProps) {
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifications)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifs.filter((n) => !n.is_read).length

  // ── Supabase Realtime subscription ──────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifs((prev) => [payload.new as Notification, ...prev].slice(0, 30))
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifs((prev) =>
            prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)),
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
    })
  }

  function handleClickNotif(notif: Notification) {
    if (!notif.is_read) {
      startTransition(() => markNotificationRead(notif.id))
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n))
    }
    setOpen(false)
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--apebi-cyan)] font-heading text-[9px] font-bold text-white"
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl"
          style={{
            background: 'var(--background)',
            borderColor: 'var(--apebi-border)',
          }}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--apebi-border)' }}
          >
            <span className="font-heading text-[13px] font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="font-heading text-[11px] font-medium text-[var(--apebi-cyan)] hover:underline disabled:opacity-50"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" aria-hidden />
                <p className="font-sans text-[12px] text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const content = (
                  <div
                    className={[
                      'border-b px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      !notif.is_read ? 'bg-[var(--apebi-cyan)]/5' : '',
                    ].join(' ')}
                    style={{ borderColor: 'var(--apebi-border)' }}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.is_read && (
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--apebi-cyan)]"
                          aria-hidden
                        />
                      )}
                      <div className={!notif.is_read ? '' : 'pl-3.5'}>
                        <p className="font-heading text-[12px] font-semibold text-foreground">
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                            {notif.body}
                          </p>
                        )}
                        <p className="mt-1 font-sans text-[10px] text-muted-foreground/60">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )

                return notif.link ? (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => handleClickNotif(notif)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleClickNotif(notif)}
                    className="w-full"
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
