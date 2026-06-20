'use client'

import { useTransition } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toggleSavedTalent } from '@/app/entreprise/favoris/actions'

interface BookmarkTalentButtonProps {
  talentId: string
  isSaved: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function BookmarkTalentButton({
  talentId,
  isSaved,
  size = 'md',
  className = '',
}: BookmarkTalentButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(() => toggleSavedTalent(talentId, isSaved))
  }

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4'
  const btnSize = size === 'sm' ? 'size-7' : 'size-8'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={[
        'flex items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] disabled:opacity-50',
        isSaved
          ? 'text-[var(--apebi-cyan)] bg-[var(--apebi-cyan)]/10 hover:bg-[var(--apebi-cyan)]/20'
          : 'text-muted-foreground hover:text-[var(--apebi-cyan)] hover:bg-[var(--apebi-cyan)]/10',
        btnSize,
        className,
      ].join(' ')}
    >
      {isSaved
        ? <BookmarkCheck className={iconSize} aria-hidden />
        : <Bookmark className={iconSize} aria-hidden />}
    </button>
  )
}
