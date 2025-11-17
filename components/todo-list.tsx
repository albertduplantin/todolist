'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  color?: string;
  dueDate?: Date;
  createdAt: Date;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const colorOptions = [
    { name: 'Bleu', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
    { name: 'Vert', value: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
    { name: 'Jaune', value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
    { name: 'Rouge', value: 'red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
    { name: 'Violet', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
    { name: 'Rose', value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
    { name: 'Gris', value: 'gray', bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900' },
  ];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: 'medium',
        }),
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos([newTodo, ...todos]);
        setNewTitle('');
        setNewDescription('');
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed }),
      });

      if (response.ok) {
        setTodos(
          todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !completed } : todo
          )
        );
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos(todos.filter((todo) => todo.id !== id));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const getColorClasses = (color: string) => {
    const option = colorOptions.find(c => c.value === color);
    return option ? `${option.bg} ${option.border}` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  // Filter and search todos
  const filteredTodos = todos.filter((todo) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !todo.title.toLowerCase().includes(query) &&
        !todo.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Priority filter
    if (filterPriority !== 'all' && todo.priority !== filterPriority) {
      return false;
    }

    // Status filter
    if (filterStatus === 'completed' && !todo.completed) {
      return false;
    }
    if (filterStatus === 'active' && todo.completed) {
      return false;
    }

    // Color filter
    if (filterColor !== 'all' && todo.color !== filterColor) {
      return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTodos.length / ITEMS_PER_PAGE);
  const paginatedTodos = filteredTodos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPriority, filterStatus, filterColor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="pt-6 space-y-3">
          <Input
            placeholder="🔍 Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="all">Toutes</option>
              <option value="active">Actives</option>
              <option value="completed">Terminées</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="all">Toutes priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="all">Toutes couleurs</option>
              {colorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
            {(searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || filterColor !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterPriority('all');
                  setFilterStatus('all');
                  setFilterColor('all');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add new todo */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter une tâche..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button 
              onClick={addTodo} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Color selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Couleur:</span>
            <div className="flex gap-1.5">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 transition-all ${
                    selectedColor === color.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {newDescription && (
            <Textarea
              placeholder="Description..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          )}
        </CardContent>
      </Card>

      {/* Todo list */}
      <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    {todos.length === 0 ? 'Aucune tâche' : 'Aucun résultat'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {todos.length === 0 
                      ? 'Ajoutez votre première tâche ci-dessus'
                      : 'Essayez de modifier vos filtres'}
                  </p>
            </CardContent>
          </Card>
        ) : (
          paginatedTodos.map((todo) => (
                <Card
                  key={todo.id}
                  className={`transition-all border-2 shadow-sm hover:shadow-md ${
                    todo.completed ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : getColorClasses(todo.color || 'blue')
                  }`}
                >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${
                            todo.completed 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                      {todo.title}
                    </h3>
                        {todo.description && (
                          <p className={`text-sm mt-1 ${
                            todo.completed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          todo.priority === 'high' 
                            ? 'bg-red-100 text-red-700'
                            : todo.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {todo.priority === 'high' && 'Haute'}
                        {todo.priority === 'medium' && 'Moyenne'}
                        {todo.priority === 'low' && 'Basse'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(todo.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Suivant
          </button>
        </div>
      )}

          {/* Stats */}
          {todos.length > 0 && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 mt-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Progression
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {todos.filter((t) => t.completed).length}
                      <span className="text-base font-normal text-gray-600 dark:text-gray-400"> / {todos.length}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    (todos.filter((t) => t.completed).length / todos.length) * 100
                  )}%
                </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Complété</div>
              </div>
            </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (todos.filter((t) => t.completed).length / todos.length) * 100
                  )}%`
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

