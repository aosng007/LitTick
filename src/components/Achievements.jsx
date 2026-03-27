/**
 * Achievements.jsx
 * "My Achievements" virtual sticker book for LitTick.
 * Reads earned badges from littick_user_badges in LocalStorage and displays them.
 */
import { useState, useEffect } from 'react'

const BADGES_KEY = 'littick_user_badges'

// Master catalogue of all possible badges
const ALL_BADGES = [
  {
    id: 'reading_star',
    emoji: '⭐',
    name: 'Reading Star',
    description: 'Completed a full 15-minute reading session!',
    colour: 'from-yellow-100 to-yellow-50 border-yellow-300',
  },
  {
    id: 'early_bird',
    emoji: '🐦',
    name: 'Early Bird',
    description: 'Started reading first thing in the morning.',
    colour: 'from-sky-100 to-sky-50 border-sky-300',
  },
  {
    id: 'word_wizard',
    emoji: '🧙',
    name: 'Word Wizard',
    description: 'Found all words in the Word Search puzzle.',
    colour: 'from-purple-100 to-purple-50 border-purple-300',
  },
  {
    id: 'puzzle_master',
    emoji: '🔍',
    name: 'Puzzle Master',
    description: 'Solved three Word Search puzzles.',
    colour: 'from-green-100 to-green-50 border-green-300',
  },
  {
    id: 'retell_hero',
    emoji: '🖐',
    name: 'Retell Hero',
    description: 'Completed the Five Finger Retell for a story.',
    colour: 'from-pink-100 to-pink-50 border-pink-300',
  },
  {
    id: 'bookworm',
    emoji: '📚',
    name: 'Bookworm',
    description: 'Read three different stories.',
    colour: 'from-orange-100 to-orange-50 border-orange-300',
  },
]

// ---------------------------------------------------------------------------
// Helper – safely read the badge list from LocalStorage
// ---------------------------------------------------------------------------
function loadBadges() {
  try {
    const raw = localStorage.getItem(BADGES_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Single badge card
// ---------------------------------------------------------------------------
function BadgeCard({ badge, earned }) {
  return (
    <div
      className={`rounded-2xl border-2 bg-gradient-to-br p-4 flex flex-col items-center gap-2 text-center transition-all
        ${earned ? badge.colour + ' shadow-md' : 'from-gray-100 to-gray-50 border-gray-200 opacity-50'}`}
      aria-label={`${badge.name} badge – ${earned ? 'earned' : 'locked'}`}
    >
      <div className={`text-5xl ${earned ? '' : 'grayscale'}`} aria-hidden="true">
        {earned ? badge.emoji : '🔒'}
      </div>
      <p className={`font-extrabold text-sm ${earned ? 'text-gray-800' : 'text-gray-400'}`}>
        {badge.name}
      </p>
      <p className="text-xs text-gray-500 leading-snug">
        {earned ? badge.description : 'Keep reading to unlock!'}
      </p>
      {earned && (
        <span className="mt-1 rounded-full bg-koala-green/20 px-2 py-0.5 text-xs font-bold text-koala-teal">
          ✓ Earned
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Achievements page
// ---------------------------------------------------------------------------
export default function Achievements({ onBack }) {
  const [earnedBadges, setEarnedBadges] = useState([])

  useEffect(() => {
    setEarnedBadges(loadBadges())
  }, [])

  const earnedCount = ALL_BADGES.filter(b => earnedBadges.includes(b.id)).length

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-gray-600 shadow hover:bg-white active:scale-95 transition-all"
          aria-label="Back to story selection"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <h1 className="font-extrabold text-koala-teal text-xl">My Achievements</h1>
        </div>
        <div className="w-20" aria-hidden="true" />
      </header>

      {/* Progress summary */}
      <div className="w-full max-w-2xl rounded-3xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-lg p-5 mb-5 text-center">
        <div className="text-4xl mb-2">🌟</div>
        <p className="font-extrabold text-koala-teal text-lg">
          {earnedCount} / {ALL_BADGES.length} Badges Earned
        </p>
        <div className="mt-3 h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-koala-green to-koala-teal transition-all duration-700"
            style={{ width: `${(earnedCount / ALL_BADGES.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={earnedCount}
            aria-valuemin={0}
            aria-valuemax={ALL_BADGES.length}
            aria-label={`${earnedCount} of ${ALL_BADGES.length} badges earned`}
          />
        </div>
        {earnedCount === 0 && (
          <p className="mt-3 text-sm text-gray-500">
            Complete reading sessions to start earning badges! 📖
          </p>
        )}
        {earnedCount === ALL_BADGES.length && (
          <p className="mt-3 text-sm font-bold text-koala-teal">
            🎉 You collected every badge! You are a true LitTick champion!
          </p>
        )}
      </div>

      {/* Badge grid */}
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ALL_BADGES.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earnedBadges.includes(badge.id)}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
        Keep reading to earn more badges! Every minute counts. ⭐
      </p>
    </div>
  )
}
