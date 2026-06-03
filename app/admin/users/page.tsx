'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle, History, Filter, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  phone: string;
  email: string | null;
  name?: string | null;
  isBlocked: boolean;
  sessionCount: number;
}

type FilterType = 'all' | 'active' | 'blocked';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Helper function to get user initials
  const getUserInitials = (user: User): string => {
    if (user.name) {
      const names = user.name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    if (user.phone && user.phone !== 'Не указан') {
      return user.phone.slice(-2);
    }
    return '?';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply filter by status
    if (filterType === 'active') {
      filtered = filtered.filter(user => !user.isBlocked);
    } else if (filterType === 'blocked') {
      filtered = filtered.filter(user => user.isBlocked);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.phone !== 'Не указан' && user.phone.toLowerCase().includes(query)) ||
          user.email?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, filterType]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch('/api/admin/users');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        console.error('Unauthorized - redirecting to login');
        window.location.href = '/admin/signin';
      } else {
        const errorText = await response.text();
        console.error('Error status:', response.status);
        console.error('Error response text:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Error response:', errorData);
        } catch (e) {
          console.error('Could not parse error as JSON');
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Ошибка при изменении статуса пользователя');
      }
    } catch (error) {
      console.error('Error toggling block status:', error);
      alert('Ошибка при изменении статуса пользователя');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Пользователи</h1>
          <p className="text-gray-400">Управление пользователями системы</p>
        </div>

        {/* Search and Filters in One Line */}
        <div className="mb-6 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по телефону, email или имени..."
              className="w-full bg-[#0f2d26] border border-emerald-500/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              <UsersIcon size={16} />
              Все ({users.length})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                filterType === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              <UserCheck size={16} />
              Активные ({users.filter((u) => !u.isBlocked).length})
            </button>
            <button
              onClick={() => setFilterType('blocked')}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                filterType === 'blocked'
                  ? 'bg-red-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              <UserX size={16} />
              Заблокированные ({users.filter((u) => u.isBlocked).length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
            </div>
          ) : (
            <div className="divide-y divide-emerald-900/30">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-6 hover:bg-[#0a1f1a] transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* User Info with Avatar */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar with Initials */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        user.isBlocked ? 'bg-red-500/30' : 'bg-emerald-500/30'
                      }`}>
                        {getUserInitials(user)}
                      </div>

                      {/* User Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium text-lg">
                            {user.name || (user.phone !== 'Не указан' ? user.phone : user.email)}
                          </span>
                          {user.isBlocked ? (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full flex items-center gap-1">
                              <Ban size={14} />
                              Заблокирован
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full flex items-center gap-1">
                              <CheckCircle size={14} />
                              Активен
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          {user.phone !== 'Не указан' && (
                            <>
                              <span>{user.phone}</span>
                              <span>•</span>
                            </>
                          )}
                          {user.email && (
                            <>
                              <span>{user.email}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            {user.sessionCount}{' '}
                            {user.sessionCount === 1
                              ? 'сессия'
                              : user.sessionCount < 5
                              ? 'сессии'
                              : 'сессий'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Icons Only */}
                    <div className="flex items-center gap-3">
                      {user.isBlocked ? (
                        <button
                          onClick={() =>
                            handleBlockToggle(user.id, user.isBlocked)
                          }
                          className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                          title="Разблокировать"
                        >
                          <CheckCircle size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleBlockToggle(user.id, user.isBlocked)
                          }
                          className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                          title="Заблокировать"
                        >
                          <Ban size={20} />
                        </button>
                      )}
                      <Link
                        href={`/admin/users/${user.id}/history`}
                        className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
                        title="История"
                      >
                        <History size={20} />
                        <span>История</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-gray-400 text-sm">Всего пользователей</div>
          </div>
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {users.filter((u) => !u.isBlocked).length}
            </div>
            <div className="text-gray-400 text-sm">Активных</div>
          </div>
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {users.filter((u) => u.isBlocked).length}
            </div>
            <div className="text-gray-400 text-sm">Заблокированных</div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/admin/dashboard"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Назад к панели
          </Link>
        </div>
      </div>
    </div>
  );
}
