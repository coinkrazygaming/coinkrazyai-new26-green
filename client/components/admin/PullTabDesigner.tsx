import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminV2 } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '@shared/constants';

interface PullTabDesign {
  id: number;
  name: string;
  description?: string;
  cost_sc: number;
  tab_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
  winning_tab_text: string;
  losing_tab_text: string;
  enabled: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  cost_sc: number;
  tab_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url: string;
  background_color: string;
  winning_tab_text: string;
  losing_tab_text: string;
  enabled: boolean;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  cost_sc: MIN_BET_SC,
  tab_count: 3,
  win_probability: 20,
  prize_min_sc: 0.01,
  prize_max_sc: MAX_WIN_SC,
  image_url: '',
  background_color: '#FF6B35',
  winning_tab_text: 'WINNER!',
  losing_tab_text: 'TRY AGAIN',
  enabled: true,
};

export function PullTabDesigner() {
  const [designs, setDesigns] = useState<PullTabDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.pullTabs.getDesigns();
      if (response.success) {
        setDesigns(response.data);
      } else {
        toast.error('Failed to load designs');
      }
    } catch (error) {
      console.error('Failed to load designs:', error);
      toast.error('Failed to load designs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (design?: PullTabDesign) => {
    if (design) {
      setEditingId(design.id);
      setFormData({
        name: design.name,
        description: design.description || '',
        cost_sc: design.cost_sc,
        tab_count: design.tab_count,
        win_probability: design.win_probability,
        prize_min_sc: design.prize_min_sc,
        prize_max_sc: design.prize_max_sc,
        image_url: design.image_url || '',
        background_color: design.background_color,
        winning_tab_text: design.winning_tab_text,
        losing_tab_text: design.losing_tab_text,
        enabled: design.enabled,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Design name is required');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        // Update existing design
        const response = await adminV2.pullTabs.updateDesign(editingId, formData);

        if (response.success) {
          toast.success('Design updated successfully');
          await loadDesigns();
          handleCloseDialog();
        } else {
          toast.error(response.error || 'Failed to update design');
        }
      } else {
        // Create new design
        const response = await adminV2.pullTabs.createDesign(formData);

        if (response.success) {
          toast.success('Design created successfully');
          await loadDesigns();
          handleCloseDialog();
        } else {
          toast.error(response.error || 'Failed to create design');
        }
      }
    } catch (error: any) {
      console.error('Failed to save design:', error);
      toast.error(error.message || 'Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const response = await adminV2.pullTabs.deleteDesign(id);

      if (response.success) {
        toast.success('Design deleted successfully');
        await loadDesigns();
      } else {
        toast.error(response.error || 'Failed to delete design');
      }
    } catch (error: any) {
      console.error('Failed to delete design:', error);
      toast.error(error.message || 'Failed to delete design');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pull Tab Designs</CardTitle>
            <CardDescription>
              Create and manage pull tab ticket designs for players
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                New Design
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Design' : 'Create New Design'}
                </DialogTitle>
                <DialogDescription>
                  Configure pull tab ticket design parameters
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Design Name *</label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Gold Rush Pull Tabs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cost (SC) *</label>
                    <Input
                      type="number"
                      value={formData.cost_sc}
                      onChange={e => setFormData({ ...formData, cost_sc: parseFloat(e.target.value) })}
                      placeholder="0.01"
                      min={MIN_BET_SC}
                      max={MAX_BET_SC}
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this ticket design"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Number of Tabs</label>
                    <Input
                      type="number"
                      value={formData.tab_count}
                      onChange={e => setFormData({ ...formData, tab_count: parseInt(e.target.value) })}
                      min="3"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Win Probability (%)</label>
                    <Input
                      type="number"
                      value={formData.win_probability}
                      onChange={e => setFormData({ ...formData, win_probability: parseFloat(e.target.value) })}
                      placeholder="20"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Min Prize (SC)</label>
                    <Input
                      type="number"
                      value={formData.prize_min_sc}
                      onChange={e => setFormData({ ...formData, prize_min_sc: parseFloat(e.target.value) })}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Prize (SC)</label>
                    <Input
                      type="number"
                      value={formData.prize_max_sc}
                      onChange={e => setFormData({ ...formData, prize_max_sc: parseFloat(e.target.value) })}
                      min="0.01"
                      max={MAX_WIN_SC}
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={e => setFormData({ ...formData, background_color: e.target.value })}
                      />
                      <Input
                        value={formData.background_color}
                        onChange={e => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#FF6B35"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Winning Tab Text</label>
                    <Input
                      value={formData.winning_tab_text}
                      onChange={e => setFormData({ ...formData, winning_tab_text: e.target.value })}
                      placeholder="WINNER!"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Losing Tab Text</label>
                    <Input
                      value={formData.losing_tab_text}
                      onChange={e => setFormData({ ...formData, losing_tab_text: e.target.value })}
                      placeholder="TRY AGAIN"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium">
                    Enabled
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Design
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No designs created yet. Click "New Design" to get started.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {designs.map(design => (
                <div
                  key={design.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border"
                  style={{ borderColor: design.background_color + '40' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: design.background_color }}
                      />
                      <div>
                        <p className="font-medium">{design.name}</p>
                        <p className="text-xs text-gray-500">
                          {design.tab_count} tabs • {design.cost_sc} SC cost • {design.win_probability}% win rate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {design.enabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        Disabled
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(design)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(design.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
