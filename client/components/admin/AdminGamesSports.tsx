import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, Upload, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScratchTicketDesigner } from './ScratchTicketDesigner';
import { PullTabDesigner } from './PullTabDesigner';
import { PullTabAnalytics } from './PullTabAnalytics';
import AdminGameAggregation from './AdminGameAggregation';

const AdminGamesSports = () => {
  const [games, setGames] = useState<any[]>([]);
  const [slotGames, setSlotGames] = useState<any[]>([]);
  const [pokerTables, setPokerTables] = useState<any[]>([]);
  const [bingoGames, setBingoGames] = useState<any[]>([]);
  const [sportsEvents, setSportsEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [bulkImportText, setBulkImportText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'Pragmatic',
    category: 'Slots',
    rtp: '95.0',
    volatility: 'Medium',
    image_url: '',
    enabled: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [gamesRes, pokerRes, bingoRes, sportsRes] = await Promise.all([
        adminV2.games.list().catch(() => ({ data: [] })),
        adminV2.poker.listTables().catch(() => ({ data: [] })),
        adminV2.bingo.listGames().catch(() => ({ data: [] })),
        adminV2.sportsbook.listEvents().catch(() => ({ data: [] }))
      ]);
      const allGames = Array.isArray(gamesRes) ? gamesRes : (gamesRes?.data || []);
      setGames(allGames);
      // Filter Slots specifically
      setSlotGames(allGames.filter((g: any) => g.category === 'Slots'));
      setPokerTables(Array.isArray(pokerRes) ? pokerRes : (pokerRes?.data || []));
      setBingoGames(Array.isArray(bingoRes) ? bingoRes : (bingoRes?.data || []));
      setSportsEvents(Array.isArray(sportsRes) ? sportsRes : (sportsRes?.data || []));
    } catch (error) {
      console.error('Failed to fetch games/sports data:', error);
      toast.error('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGame = async () => {
    if (!formData.name || !formData.image_url) {
      toast.error('Game name and image URL are required');
      return;
    }

    setIsCreating(true);
    try {
      await adminV2.games.create({
        name: formData.name,
        provider: formData.provider,
        category: formData.category,
        rtp: parseFloat(formData.rtp),
        volatility: formData.volatility,
        image_url: formData.image_url,
        enabled: formData.enabled
      });
      toast.success(`Game "${formData.name}" added successfully!`);
      setFormData({
        name: '',
        provider: 'Pragmatic',
        category: 'Slots',
        rtp: '95.0',
        volatility: 'Medium',
        image_url: '',
        enabled: true
      });
      setShowAddForm(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGame = async (gameId: number, gameName: string) => {
    if (!window.confirm(`Delete game "${gameName}"?`)) return;

    try {
      await adminV2.games.delete(gameId);
      toast.success(`Game "${gameName}" deleted`);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete game');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast.error('Please paste game data');
      return;
    }

    setIsCreating(true);
    try {
      // Parse JSON format: [{ name, provider, image_url }, ...]
      const games = JSON.parse(bulkImportText);
      if (!Array.isArray(games)) {
        throw new Error('Data must be a JSON array');
      }

      let successCount = 0;
      for (const game of games) {
        try {
          await adminV2.games.create({
            name: game.name,
            provider: game.provider || 'Pragmatic',
            category: 'Slots',
            rtp: game.rtp ? parseFloat(game.rtp) : 95.0,
            volatility: game.volatility || 'Medium',
            image_url: game.image_url,
            enabled: game.enabled !== false
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to add ${game.name}:`, err);
        }
      }

      toast.success(`Added ${successCount} of ${games.length} games`);
      setBulkImportText('');
      setShowBulkImport(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse game data');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGames = slotGames.filter((game: any) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = !filterProvider || game.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  const providers = [...new Set(slotGames.map((g: any) => g.provider))].sort();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="slots" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="poker">Poker</TabsTrigger>
          <TabsTrigger value="bingo">Bingo</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="pull-tabs">Pull Tabs</TabsTrigger>
          <TabsTrigger value="scratch">Scratch</TabsTrigger>
          <TabsTrigger value="aggregation">Aggregation</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
        </TabsList>

        {/* Slots Management */}
        <TabsContent value="slots" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pragmatic Play Slots</CardTitle>
                <CardDescription>Manage slot games, RTP, volatility and settings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={fetchData}>Refresh</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-300">
                  Slot games use SC (Sweeps Coins) currency with bet range 0.01 - 5.00 SC. Use bulk import for multiple games.
                </p>
              </div>

              {/* Control Bar */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-2 lg:flex-row lg:gap-3 flex-1">
                  <div className="relative flex-1 lg:max-w-xs">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search games..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <select
                    value={filterProvider || ''}
                    onChange={(e) => setFilterProvider(e.target.value || null)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">All Providers</option>
                    {providers.map((provider: string) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBulkImport(true)}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Import
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Game
                  </Button>
                </div>
              </div>

              {/* Add Game Form Modal */}
              {showAddForm && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Add New Slot Game</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1">Game Name *</label>
                      <Input
                        placeholder="e.g., Sweet Bonanza"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Provider *</label>
                      <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option>Pragmatic</option>
                        <option>NetEnt</option>
                        <option>Microgaming</option>
                        <option>Play'n GO</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">RTP % *</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="70"
                        max="98"
                        placeholder="95.0"
                        value={formData.rtp}
                        onChange={(e) => setFormData({ ...formData, rtp: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Volatility *</label>
                      <select
                        value={formData.volatility}
                        onChange={(e) => setFormData({ ...formData, volatility: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium block mb-1">Image URL *</label>
                      <Input
                        placeholder="https://..."
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.enabled}
                          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Enabled</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddGame}
                      disabled={isCreating}
                    >
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Game'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Import Modal */}
              {showBulkImport && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Bulk Import Games</h3>
                    <button onClick={() => setShowBulkImport(false)} className="text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    <p className="mb-2">Paste JSON array of games. Example format:</p>
                    <code className="block bg-black/20 p-2 rounded text-[11px] overflow-x-auto">
                      [{"{"}"name":"Game 1","provider":"Pragmatic","image_url":"https://...","rtp":95.0,"volatility":"High"{"}"},...]
                    </code>
                  </div>
                  <textarea
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    placeholder='[{"name":"Sweet Bonanza","provider":"Pragmatic","image_url":"https://...","rtp":96.49,"volatility":"High"}]'
                    className="w-full px-3 py-2 border rounded-md font-mono text-xs h-32 resize-none"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkImport(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkImport}
                      disabled={isCreating}
                    >
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import Games'}
                    </Button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredGames.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredGames.length} of {slotGames.length} games
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGames.map((game: any) => (
                      <div key={game.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                        {/* Game Image */}
                        {game.image_url && (
                          <div className="mb-3 rounded overflow-hidden bg-muted h-32 flex items-center justify-center">
                            <img
                              src={game.image_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}
                        {/* Game Details */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">{game.name}</p>
                              <p className="text-xs text-muted-foreground">{game.provider || 'Internal'}</p>
                            </div>
                            <Badge variant={game.enabled ? 'default' : 'secondary'} className="text-[10px]">
                              {game.enabled ? 'Active' : 'Off'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-muted p-2 rounded">
                              <p className="font-mono text-[11px]">{game.rtp}%</p>
                              <p className="text-[10px] text-muted-foreground">RTP</p>
                            </div>
                            <div className="bg-muted p-2 rounded">
                              <p className="text-[11px]">{game.volatility || 'N/A'}</p>
                              <p className="text-[10px] text-muted-foreground">Volatility</p>
                            </div>
                            <div className="bg-muted p-2 rounded">
                              <p className="text-[11px] font-semibold">{new Date(game.created_at).getFullYear()}</p>
                              <p className="text-[10px] text-muted-foreground">Year</p>
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs gap-1"
                            onClick={() => {
                              const newRtp = prompt('Enter new RTP:', String(game.rtp));
                              if (newRtp) {
                                adminV2.games.update(game.id, { rtp: parseFloat(newRtp) })
                                  .then(() => { toast.success('RTP updated'); fetchData(); })
                                  .catch(() => toast.error('Failed to update'));
                              }
                            }}
                          >
                            <Edit className="w-3 h-3" />
                            RTP
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              adminV2.games.update(game.id, { enabled: !game.enabled })
                                .then(() => { toast.success(game.enabled ? 'Disabled' : 'Enabled'); fetchData(); })
                                .catch(() => toast.error('Failed to toggle'));
                            }}
                          >
                            {game.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => handleDeleteGame(game.id, game.name)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-3">No games found</p>
                  <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Game
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Management */}
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Game Library</CardTitle>
                <CardDescription>Manage casino games and configurations</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchData}>Refresh</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await adminV2.games.create({
                    name: formData.get('gameName'),
                    category: formData.get('category'),
                    rtp: formData.get('rtp'),
                  });
                  toast.success('Game added');
                  fetchData();
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  toast.error('Failed to add game');
                }
              }} className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Game Name</label>
                  <Input name="gameName" placeholder="e.g., Mega Slots" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Category</label>
                  <select name="category" className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option>Slots</option>
                    <option>Poker</option>
                    <option>Bingo</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">RTP %</label>
                  <Input name="rtp" placeholder="95.5" type="number" step="0.1" required />
                </div>
                <Button type="submit">Add Game</Button>
              </form>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : games.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Game Name</th>
                        <th className="text-left py-2 px-2">Category</th>
                        <th className="text-left py-2 px-2">RTP</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game: any) => (
                        <tr key={game.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-semibold">{game.name}</td>
                          <td className="py-3 px-2">{game.category}</td>
                          <td className="py-3 px-2 font-mono">{game.rtp}%</td>
                          <td className="py-3 px-2">
                            <Badge variant={game.enabled ? 'default' : 'secondary'}>
                              {game.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => toast.info('Edit coming soon')}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                const newRtp = prompt('Enter new RTP:', String(game.rtp));
                                if (newRtp) {
                                  adminV2.games.update(game.id, { rtp: parseFloat(newRtp) })
                                    .then(() => { toast.success('Updated'); fetchData(); })
                                    .catch(() => toast.error('Failed'));
                                }
                              }}>RTP</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No games found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Poker Management */}
        <TabsContent value="poker" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Poker Tables</CardTitle>
                <CardDescription>Manage poker tables and stakes</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchData}>Refresh</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await adminV2.poker.createTable({
                    name: formData.get('tableName'),
                    stakes: formData.get('stakes'),
                    buyInMin: formData.get('buyInMin'),
                    buyInMax: formData.get('buyInMax'),
                  });
                  toast.success('Table created');
                  fetchData();
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  toast.error('Failed to create table');
                }
              }} className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Table Name</label>
                  <Input name="tableName" placeholder="e.g., Diamond Table" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Stakes</label>
                  <Input name="stakes" placeholder="e.g., $1/$2" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Min Buy-in</label>
                  <Input name="buyInMin" placeholder="20" type="number" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Max Buy-in</label>
                  <Input name="buyInMax" placeholder="200" type="number" required />
                </div>
                <Button type="submit" className="md:col-span-4">Create Table</Button>
              </form>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : pokerTables.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pokerTables.map((table: any) => (
                    <div key={table.id} className="p-4 border rounded-lg">
                      <p className="font-semibold">{table.name}</p>
                      <p className="text-sm text-muted-foreground">{table.stakes}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Max Players:</span> {table.max_players || 8}</p>
                        <p><span className="text-muted-foreground">Current:</span> {table.current_players || 0}</p>
                        <p><span className="text-muted-foreground">Buy-in:</span> ${table.buy_in_min || 0} - ${table.buy_in_max || 0}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Stats coming soon')}>Stats</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No poker tables found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bingo Management */}
        <TabsContent value="bingo" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bingo Games</CardTitle>
                <CardDescription>Manage bingo rooms and patterns</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchData}>Refresh</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await adminV2.bingo.createGame({
                    name: formData.get('gameName'),
                    pattern: formData.get('pattern'),
                    jackpot: formData.get('jackpot'),
                  });
                  toast.success('Bingo game created');
                  fetchData();
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  toast.error('Failed to create game');
                }
              }} className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Game Name</label>
                  <Input name="gameName" placeholder="e.g., Morning Bonanza" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Pattern</label>
                  <select name="pattern" className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option>5-line</option>
                    <option>Full Card</option>
                    <option>Corner</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Jackpot</label>
                  <Input name="jackpot" placeholder="1000" type="number" required />
                </div>
                <Button type="submit">Create Game</Button>
              </form>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : bingoGames.length > 0 ? (
                <div className="space-y-3">
                  {bingoGames.map((game: any) => (
                    <div key={game.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{game.name}</p>
                        <p className="text-sm text-muted-foreground">Pattern: {game.pattern}</p>
                        <p className="text-xs text-muted-foreground">Jackpot: ${game.jackpot || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Caller</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No bingo games found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sports Management */}
        <TabsContent value="sports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sportsbook Events</CardTitle>
                <CardDescription>Manage sports events and odds</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchData}>Refresh</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await adminV2.sportsbook.createEvent({
                    sport: formData.get('sport'),
                    eventName: formData.get('eventName'),
                    status: formData.get('status'),
                  });
                  toast.success('Event created');
                  fetchData();
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  toast.error('Failed to create event');
                }
              }} className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Sport</label>
                  <select name="sport" className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option>NFL</option>
                    <option>NBA</option>
                    <option>Soccer</option>
                    <option>Tennis</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Event Name</label>
                  <Input name="eventName" placeholder="e.g., Team A vs Team B" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Status</label>
                  <select name="status" className="w-full px-3 py-2 border rounded-md text-sm" required>
                    <option>Upcoming</option>
                    <option>Live</option>
                    <option>Closed</option>
                  </select>
                </div>
                <Button type="submit">Create Event</Button>
              </form>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sportsEvents.length > 0 ? (
                <div className="space-y-3">
                  {sportsEvents.map((event: any) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{event.event_name}</p>
                        <Badge variant={event.status === 'Live' ? 'destructive' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.sport}</p>
                      <p className="text-xs text-muted-foreground">Total Bets: {(event.total_bets || 0).toLocaleString()}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => toast.info('Edit odds coming soon')}>Edit Odds</Button>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Settle coming soon')}>Settle</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No sports events found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pull Tabs Management */}
        <TabsContent value="pull-tabs" className="space-y-4">
          <div className="space-y-6">
            <PullTabDesigner />
            <PullTabAnalytics />
          </div>
        </TabsContent>

        {/* Scratch Tickets */}
        <TabsContent value="scratch" className="space-y-4">
          <ScratchTicketDesigner />
        </TabsContent>

        {/* Game Ingestion */}
        <TabsContent value="ingestion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Data Ingestion</CardTitle>
              <CardDescription>Import games from external providers and AI builders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">External Provider</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    try {
                      const gameIdInput = prompt('Enter game ID to ingest:');
                      if (!gameIdInput) {
                        toast.info('Ingestion cancelled');
                        return;
                      }

                      const gameId = parseInt(gameIdInput, 10);
                      if (isNaN(gameId) || gameId <= 0) {
                        toast.error('Please enter a valid game ID (number greater than 0)');
                        return;
                      }

                      await adminV2.games.ingestData(gameId, {
                        provider: formData.get('provider'),
                        apiKey: formData.get('apiKey'),
                      });
                      toast.success('Game ingested successfully');
                      fetchData();
                    } catch (error) {
                      toast.error('Failed to ingest game');
                    }
                  }} className="space-y-2">
                    <select name="provider" className="w-full px-3 py-2 border rounded-md text-sm">
                      <option>Select Provider...</option>
                      <option>Pragmatic Play</option>
                      <option>Microgaming</option>
                      <option>NetEnt</option>
                      <option>Other</option>
                    </select>
                    <Input name="apiKey" placeholder="API Key" type="password" required />
                    <Button className="w-full" type="submit">Connect & Sync</Button>
                  </form>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">AI Game Builder</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    toast.info('AI Game Builder - This feature creates games using AI. Coming soon!');
                  }} className="space-y-2">
                    <Input placeholder="Game Name" required />
                    <Input placeholder="Game Description" required />
                    <Button className="w-full" type="submit">Build with AI</Button>
                  </form>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Slots Game Crawler</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const url = formData.get('crawlUrl') as string;
                    try {
                      const res = await adminV2.games.crawlSlots(url);
                      if (res.success) {
                        toast.success(res.message || 'Crawl started');
                        (e.target as HTMLFormElement).reset();
                      } else {
                        toast.error(res.error || 'Failed to start crawl');
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to connect to crawler');
                    }
                  }} className="space-y-2">
                    <Input name="crawlUrl" placeholder="Enter URL to crawl (e.g., https://games.com/slots)" type="url" required />
                    <p className="text-[10px] text-muted-foreground italic">Automatically identifies and imports slot game mechanics from provided URL.</p>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700" type="submit">Start Crawler</Button>
                  </form>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold">Ingestion Queue</p>
                <p className="text-xs text-muted-foreground">Monitoring for pending ingestions...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGamesSports;
