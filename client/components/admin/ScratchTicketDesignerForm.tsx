import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';

import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '@shared/constants';

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
}

interface DesignFormProps {
  design: TicketDesign | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA15E', '#BC6C25'];

export const DesignForm: React.FC<DesignFormProps> = ({ design, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: design?.name || '',
    description: design?.description || '',
    cost_sc: design?.cost_sc || MIN_BET_SC,
    slot_count: design?.slot_count || 6,
    win_probability: design?.win_probability || 16.67,
    prize_min_sc: design?.prize_min_sc || 0.01,
    prize_max_sc: design?.prize_max_sc || MAX_WIN_SC,
    image_url: design?.image_url || '',
    background_color: design?.background_color || '#FFD700',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('prize') || name.startsWith('cost') || name.startsWith('slot') || name === 'win_probability'
        ? parseFloat(value)
        : value,
    }));
  };

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Design name is required');
      return false;
    }
    if (formData.cost_sc < MIN_BET_SC || formData.cost_sc > MAX_BET_SC) {
      toast.error(`Cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC`);
      return false;
    }
    if (formData.slot_count < 6 || formData.slot_count > 9) {
      toast.error('Slot count must be between 6 and 9');
      return false;
    }
    if (formData.prize_min_sc < 0.01 || formData.prize_max_sc > MAX_WIN_SC) {
      toast.error(`Prize range must be between 0.01 and ${MAX_WIN_SC} SC`);
      return false;
    }
    if (formData.prize_min_sc > formData.prize_max_sc) {
      toast.error('Minimum prize cannot be greater than maximum prize');
      return false;
    }
    if (formData.win_probability < 1 || formData.win_probability > 100) {
      toast.error('Win probability must be between 1 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      if (design) {
        // Update existing design
        await adminApiCall<any>(`/admin/v2/scratch-tickets/designs/${design.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Design updated successfully');
      } else {
        // Create new design
        await adminApiCall<any>('/admin/v2/scratch-tickets/designs', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Design created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Failed to save design:', error);
      toast.error(error.message || 'Failed to save design');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{design ? 'Edit Design' : 'Create New Design'}</DialogTitle>
          <DialogDescription>
            {design ? 'Update the scratch ticket design details' : 'Create a new scratch ticket design'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div>
              <Label htmlFor="name">Design Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Gold Ticket, Diamond Special"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this ticket design..."
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pricing & Configuration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost_sc">Cost (SC) *</Label>
                <Input
                  id="cost_sc"
                  name="cost_sc"
                  type="number"
                  min={MIN_BET_SC}
                  max={MAX_BET_SC}
                  step="0.01"
                  value={formData.cost_sc}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slot_count">Number of Slots (6-9) *</Label>
                <Input
                  id="slot_count"
                  name="slot_count"
                  type="number"
                  min="6"
                  max="9"
                  value={formData.slot_count}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="win_probability">Win Probability (%) *</Label>
                <Input
                  id="win_probability"
                  name="win_probability"
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={formData.win_probability}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 out of {Math.round(100 / formData.win_probability)} tickets wins
                </p>
              </div>
            </div>
          </div>

          {/* Prize Range */}
          <div className="space-y-4">
            <h3 className="font-semibold">Prize Range</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prize_min_sc">Minimum Prize (SC) *</Label>
                <Input
                  id="prize_min_sc"
                  name="prize_min_sc"
                  type="number"
                  min="0.01"
                  max={MAX_WIN_SC}
                  step="0.01"
                  value={formData.prize_min_sc}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="prize_max_sc">Maximum Prize (SC) *</Label>
                <Input
                  id="prize_max_sc"
                  name="prize_max_sc"
                  type="number"
                  min="0.01"
                  max={MAX_WIN_SC}
                  step="0.01"
                  value={formData.prize_max_sc}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Design Styling */}
          <div className="space-y-4">
            <h3 className="font-semibold">Design Styling</h3>

            <div>
              <Label htmlFor="background_color">Background Color</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-12 h-12 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.background_color === color ? '#000' : '#ddd',
                      borderWidth: formData.background_color === color ? 3 : 2,
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, background_color: color }))}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-2">
                <Input
                  id="background_color"
                  name="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Upload an image to use as the ticket background
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2 text-sm">
            <p>
              <strong>Summary:</strong> Players will pay <strong>{formData.cost_sc} SC</strong> for a ticket with{' '}
              <strong>{formData.slot_count} slots</strong>. They have a <strong>{formData.win_probability}%</strong> chance to
              win between <strong>{formData.prize_min_sc}</strong> and <strong>{formData.prize_max_sc} SC</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {design ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{design ? 'Update Design' : 'Create Design'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
