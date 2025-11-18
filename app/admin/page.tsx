'use client';

import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Users,
  MessageSquare,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

interface Member {
  id: string;
  userId: string;
  username: string;
  email: string;
  joinedAt: Date;
}

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [syncingUsers, setSyncingUsers] = useState(false);

  // Form states
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');

  useEffect(() => {
    if (isLoaded) {
      // Check if user is admin
      if (user?.publicMetadata?.isAdmin !== true) {
        router.push('/');
        return;
      }
      syncUser();
      fetchRooms();
    }
  }, [isLoaded, user, router]);

  const syncUser = async () => {
    try {
      await fetch('/api/sync-user');
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchMembers(selectedRoom);
      fetchAllUsers();
    }
  }, [selectedRoom]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/members?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          description: roomDescription,
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms([...rooms, newRoom]);
        setRoomName('');
        setRoomDescription('');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const deleteRoom = async (roomId: string) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce salon ? Tous les messages seront perdus.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/rooms?id=${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRooms(rooms.filter((r) => r.id !== roomId));
        if (selectedRoom === roomId) {
          setSelectedRoom(null);
        }
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const syncAllUsers = async () => {
    setSyncingUsers(true);
    try {
      const response = await fetch('/api/sync-all-users', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Synchronisation réussie!\n\n${result.created} utilisateurs créés\n${result.updated} utilisateurs mis à jour\n${result.errors} erreurs`);
        // Reload users list
        fetchAllUsers();
      } else {
        alert('Erreur lors de la synchronisation des utilisateurs');
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      alert('Erreur lors de la synchronisation des utilisateurs');
    } finally {
      setSyncingUsers(false);
    }
  };

  const inviteSelectedUsers = async () => {
    if (selectedUserIds.length === 0 || !selectedRoom) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      // Invite each selected user
      const promises = selectedUserIds.map(userId => {
        const userToInvite = allUsers.find(u => u.id === userId);
        if (!userToInvite) return null;

        return fetch('/api/rooms/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom,
            userEmail: userToInvite.email,
          }),
        });
      });

      await Promise.all(promises.filter(p => p !== null));
      
      setSelectedUserIds([]);
      fetchMembers(selectedRoom);
      alert(`${selectedUserIds.length} utilisateur(s) invité(s) avec succès !`);
    } catch (error) {
      console.error('Error inviting users:', error);
      alert('Erreur lors de l\'invitation');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeMember = async (memberId: string) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir retirer ce membre ?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/rooms/members?id=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok && selectedRoom) {
        fetchMembers(selectedRoom);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Administration
              </h1>
              <p className="text-sm text-gray-500">
                Gestion des salons et utilisateurs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={syncAllUsers}
              disabled={syncingUsers}
              size="sm"
              variant="outline"
              className="text-sm"
            >
              {syncingUsers ? 'Synchronisation...' : 'Sync Utilisateurs'}
            </Button>
            <div className="text-sm text-gray-600 hidden sm:block">
              {user?.firstName || user?.username}
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Rooms */}
          <div className="space-y-6">
            {/* Create room */}
            <Card className="bg-white border border-gray-200 shadow">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Créer un nouveau salon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nom du salon
                  </label>
                  <Input
                    placeholder="Ex: Équipe Marketing"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Description (optionnelle)
                  </label>
                  <Textarea
                    placeholder="Décrivez l'objectif de ce salon..."
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    rows={2}
                    className="bg-white border-gray-300"
                  />
                </div>
                <Button 
                  onClick={createRoom} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le salon
                </Button>
              </CardContent>
            </Card>

            {/* Room list */}
            <Card className="bg-white border border-gray-200 shadow">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">
                  Salons actifs ({rooms.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Aucun salon créé</p>
                      <p className="text-xs mt-1">Créez votre premier salon ci-dessus</p>
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedRoom === room.id
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                            {room.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {room.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(room.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoom(room.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Members */}
          <div className="space-y-6">
            {selectedRoom ? (
              <>
                {/* Add users */}
                <Card className="bg-white border border-gray-200 shadow">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between text-gray-900">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        Ajouter des utilisateurs
                      </div>
                      {selectedUserIds.length > 0 && (
                        <span className="text-sm font-normal text-gray-600">
                          {selectedUserIds.length} sélectionné(s)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                      {allUsers
                        .filter(u => !members.some(m => m.email === u.email))
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <Checkbox
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.username}
                                {user.isAdmin && (
                                  <span className="ml-2 text-xs text-blue-600">(Admin)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      {allUsers.filter(u => !members.some(m => m.email === u.email)).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Tous les utilisateurs sont déjà membres
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={inviteSelectedUsers} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={selectedUserIds.length === 0}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Ajouter {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
                    </Button>
                  </CardContent>
                </Card>

                {/* Current members */}
                <Card className="bg-white border border-gray-200 shadow">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Users className="h-5 w-5 text-green-600" />
                      Membres actuels ({members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {members.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucun membre dans ce salon
                        </p>
                      ) : (
                        members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{member.username}</p>
                              <p className="text-sm text-gray-600 truncate">{member.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Depuis le {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white border border-gray-200 shadow">
                <CardContent className="py-20 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 font-medium">Sélectionnez un salon</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Choisissez un salon pour gérer les membres
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

