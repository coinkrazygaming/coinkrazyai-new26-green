import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';
import { DesignForm } from './ScratchTicketDesignerForm';

interface TicketDesign {
  id: number;
  name: string;
  description: string;
  cost_sc: number;
  slot_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const ScratchTicketDesigner: React.FC = () => {
  const [designs, setDesigns] = useState<TicketDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<TicketDesign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiCall<any>('/admin/v2/scratch-tickets/designs');
      if (response.success) {
        setDesigns(response.data || []);
      } else {
        toast.error('Failed to load designs');
      }
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      toast.error('Failed to load designs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      await adminApiCall<any>(`/admin/v2/scratch-tickets/designs/${id}`, {
        method: 'DELETE',
      });
      toast.success('Design deleted successfully');
      fetchDesigns();
    } catch (error) {
      console.error('Failed to delete design:', error);
      toast.error('Failed to delete design');
    }
  };

  const handleToggleEnabled = async (design: TicketDesign) => {
    try {
      await adminApiCall<any>(`/admin/v2/scratch-tickets/designs/${design.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !design.enabled }),
      });
      toast.success(`Design ${!design.enabled ? 'enabled' : 'disabled'}`);
      fetchDesigns();
    } catch (error) {
      console.error('Failed to update design:', error);
      toast.error('Failed to update design');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDesign(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchDesigns();
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          design.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEnabled === 'all' || 
                         (filterEnabled === 'enabled' && design.enabled) ||
                         (filterEnabled === 'disabled' && !design.enabled);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scratch Ticket Designer</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage scratch ticket designs
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Design
        </Button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <DesignForm
          design={editingDesign}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search designs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant={filterEnabled === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterEnabled('all')}
                size="sm"
              >
                All ({designs.length})
              </Button>
              <Button
                variant={filterEnabled === 'enabled' ? 'default' : 'outline'}
                onClick={() => setFilterEnabled('enabled')}
                size="sm"
              >
                Active ({designs.filter(d => d.enabled).length})
              </Button>
              <Button
                variant={filterEnabled === 'disabled' ? 'default' : 'outline'}
                onClick={() => setFilterEnabled('disabled')}
                size="sm"
              >
                Disabled ({designs.filter(d => !d.enabled).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designs Table */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </CardContent>
        </Card>
      ) : filteredDesigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <p>No designs found</p>
            <Button onClick={() => setIsFormOpen(true)} variant="outline" className="mt-4">
              Create your first design
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDesigns.map(design => (
            <Card key={design.id} className={!design.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{design.name}</CardTitle>
                    {design.description && (
                      <CardDescription className="mt-1">{design.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {design.enabled ? (
                      <Badge className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                    <p className="text-lg font-bold">{design.cost_sc} SC</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Slots</p>
                    <p className="text-lg font-bold">{design.slot_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Win Odds</p>
                    <p className="text-lg font-bold">{design.win_probability}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Prize Range</p>
                    <p className="text-lg font-bold">
                      {design.prize_min_sc}-{design.prize_max_sc} SC
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDesign(design);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEnabled(design)}
                  >
                    {design.enabled ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(design.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
