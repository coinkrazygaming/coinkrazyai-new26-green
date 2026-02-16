import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, Download, Upload, Trash2, Search, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface GameProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
}

interface AggregationStats {
  totalGames: number;
  gamesByProvider: Record<string, number>;
  lastSyncTime: string | null;
}

const AdminGameAggregation = () => {
  const [providers, setProviders] = useState<GameProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setSyncing] = useState<string | null>(null);
  const [stats, setStats] = useState<AggregationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [providersRes, statsRes] = await Promise.all([
        adminV2.aggregation.getProviders(),
        adminV2.aggregation.getStats()
      ]);

      setProviders(providersRes.data || []);
      setStats(statsRes.data || null);
    } catch (error: any) {
      console.error('Failed to fetch aggregation data:', error);
      toast.error('Failed to load aggregation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    setSyncing(providerId);
    try {
      const result = await adminV2.aggregation.syncProvider(providerId);
      toast.success(`Synced ${providerId}: ${result.data.imported} imported, ${result.data.updated} updated`);
      await fetchData();
    } catch (error: any) {
      toast.error(`Failed to sync ${providerId}: ${error.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing('all');
    try {
      const result = await adminV2.aggregation.syncAllProviders();
      toast.success(`Synced all providers: ${result.data.totalImported} imported, ${result.data.totalUpdated} updated`);
      await fetchData();
    } catch (error: any) {
      toast.error(`Failed to sync all providers: ${error.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast.error('Please paste game data');
      return;
    }

    try {
      setSyncing('bulk-import');
      const games = JSON.parse(bulkImportText);
      if (!Array.isArray(games)) {
        throw new Error('Data must be a JSON array');
      }

      const result = await adminV2.aggregation.bulkImport(games);
      toast.success(`Imported: ${result.data.imported} new, ${result.data.updated} updated`);
      setBulkImportText('');
      setShowBulkImport(false);
      await fetchData();
    } catch (error: any) {
      toast.error(`Failed to import: ${error.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteProviderGames = async (providerId: string) => {
    if (!window.confirm(`Delete all games from ${providerId}?`)) return;

    try {
      const result = await adminV2.aggregation.deleteProviderGames(providerId);
      toast.success(result.message || 'Games deleted');
      await fetchData();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const handleExportGames = async (provider?: string) => {
    try {
      const result = await adminV2.aggregation.exportGames({ provider });
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `games-${provider || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Games exported');
    } catch (error: any) {
      toast.error(`Failed to export: ${error.message}`);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Game Providers</CardTitle>
                <CardDescription>Manage and sync games from multiple providers</CardDescription>
              </div>
              <Button size="sm" onClick={handleSyncAll} disabled={isSyncing !== null} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {isSyncing === 'all' ? 'Syncing...' : 'Sync All'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition"
                  >
                    {/* Provider Info */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                          {provider.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: <span className="font-mono">{provider.type}</span>
                      </p>
                    </div>

                    {/* Game Count */}
                    {stats?.gamesByProvider[provider.name] && (
                      <div className="bg-muted p-2 rounded text-center">
                        <p className="text-2xl font-bold">
                          {stats.gamesByProvider[provider.name]}
                        </p>
                        <p className="text-xs text-muted-foreground">Games Available</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncProvider(provider.id)}
                        disabled={isSyncing !== null}
                        className="h-8 text-xs gap-1"
                      >
                        {isSyncing === provider.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Syncing
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            Sync
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportGames(provider.name)}
                        className="h-8 text-xs gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProvider(provider.id)}
                        className="col-span-2 h-8 text-xs"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProviders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No providers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aggregation Statistics</CardTitle>
              <CardDescription>Overview of synchronized games</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Games */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-primary" />
                    <p className="text-sm text-muted-foreground">Total Games</p>
                  </div>
                  <p className="text-4xl font-bold">{stats?.totalGames || 0}</p>
                </div>

                <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-6 h-6 text-blue-500" />
                    <p className="text-sm text-muted-foreground">Last Sync</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {stats?.lastSyncTime
                      ? new Date(stats.lastSyncTime).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Games by Provider */}
              <div className="space-y-3">
                <h3 className="font-semibold">Games by Provider</h3>
                <div className="space-y-2">
                  {stats?.gamesByProvider && Object.entries(stats.gamesByProvider).map(([provider, count]) => (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{provider}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${((count as number) / (stats.totalGames || 1)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="font-semibold text-right min-w-12">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bulk Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Bulk Import
                </CardTitle>
                <CardDescription>Import games from JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowBulkImport(true)}
                  className="w-full gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Start Import
                </Button>
              </CardContent>
            </Card>

            {/* Export All Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export All
                </CardTitle>
                <CardDescription>Download all games as JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExportGames()}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Games
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Import Modal */}
          {showBulkImport && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Import Games from JSON</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-muted-foreground mb-2">
                  <p className="mb-2">Expected format:</p>
                  <code className="block bg-black/20 p-2 rounded overflow-x-auto text-[11px]">
{`[
  {
    "provider_name": "Pragmatic",
    "external_id": "game_1",
    "name": "Sweet Bonanza",
    "rtp": 96.49,
    "category": "Slots",
    ...
  }
]`}
                  </code>
                </div>
                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="Paste JSON game data here..."
                  className="w-full px-3 py-2 border rounded-md font-mono text-xs h-40 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkImport(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkImport}
                    disabled={isSyncing === 'bulk-import'}
                    className="flex-1 gap-2"
                  >
                    {isSyncing === 'bulk-import' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGameAggregation;
