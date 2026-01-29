'use client'

import { UserProfile } from '@/types/database'

interface HeaderProps {
  user: UserProfile
  onMenuClick: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-4">
          {/* User */}
          <div className="flex items-center gap-2 pl-4 border-l">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'superadmin' ? 'Суперадмин' : 'Админ'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
