import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Star, TrendingUp } from 'lucide-react';

export const VIPManagement = () => {
  const [vipTiers, setVipTiers] = useState([
    {
      id: 1,
      name: 'Bronze VIP',
      minDeposits: '$500',
      benefits: ['2% Cashback', 'Priority Support', 'Monthly Bonus $25'],
      members: 342,
      monthlyRevenue: '$15,230'
    },
    {
      id: 2,
      name: 'Silver VIP',
      minDeposits: '$2,500',
      benefits: ['5% Cashback', '24/7 Support', 'Monthly Bonus $75', 'Birthday Bonus'],
      members: 128,
      monthlyRevenue: '$42,500'
    },
    {
      id: 3,
      name: 'Gold VIP',
      minDeposits: '$10,000',
      benefits: ['8% Cashback', 'Personal Manager', 'Monthly Bonus $200', 'VIP Events', 'Free Plays'],
      members: 34,
      monthlyRevenue: '$89,230'
    },
    {
      id: 4,
      name: 'Platinum VIP',
      minDeposits: '$50,000+',
      benefits: ['12% Cashback', 'Dedicated Manager', 'Monthly Bonus $500', 'Exclusive Events', 'Custom Perks'],
      members: 8,
      monthlyRevenue: '$156,800'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* VIP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total VIP Members</p>
            <p className="text-3xl font-black">512</p>
            <p className="text-xs text-green-500 mt-2">+8% this month</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">VIP Revenue</p>
            <p className="text-3xl font-black">$303.7K</p>
            <p className="text-xs text-green-500 mt-2">Monthly</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Tier</p>
            <p className="text-3xl font-black">Silver</p>
            <p className="text-xs text-muted-foreground mt-2">25% are Gold+</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Benefits Cost</p>
            <p className="text-3xl font-black">$24.5K</p>
            <p className="text-xs text-muted-foreground mt-2">Monthly spend</p>
          </CardContent>
        </Card>
      </div>

      {/* VIP Tiers */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>VIP Tier Management</CardTitle>
              <CardDescription>Configure tiers and member benefits</CardDescription>
            </div>
            <Button className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vipTiers.map((tier) => (
              <div key={tier.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h4 className="font-bold text-lg">{tier.name}</h4>
                      <p className="text-sm text-muted-foreground">Min: {tier.minDeposits}</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none">{tier.members} Members</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Members</p>
                    <p className="text-lg font-black">{tier.members}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Monthly Rev</p>
                    <p className="text-lg font-black">{tier.monthlyRevenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Benefits</p>
                    <p className="text-lg font-black">{tier.benefits.length}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-bold mb-2">Benefits:</p>
                  <div className="flex flex-wrap gap-2">
                    {tier.benefits.map((benefit) => (
                      <Badge key={benefit} className="bg-muted/50 border-none text-xs">{benefit}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">View Members</Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VIP Member List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Top VIP Members</CardTitle>
          <CardDescription>Highest spending VIP players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'John Whale', tier: 'Platinum', spent: '$125,000', joined: '2023-06-15' },
              { name: 'Sarah Rich', tier: 'Platinum', spent: '$98,500', joined: '2023-08-22' },
              { name: 'Mike Money', tier: 'Gold', spent: '$75,200', joined: '2023-09-10' },
              { name: 'Jane Spender', tier: 'Gold', spent: '$62,800', joined: '2023-10-05' },
              { name: 'Tom Luxury', tier: 'Silver', spent: '$45,300', joined: '2023-11-12' }
            ].map((member) => (
              <div key={member.name} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
                <div>
                  <p className="font-bold">{member.name}</p>
                  <p className="text-xs text-muted-foreground">Joined {member.joined}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-purple-500/10 text-purple-500 border-none mb-1" style={{display: 'block'}}>{member.tier}</Badge>
                  <p className="text-sm font-black">{member.spent}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefit Templates */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Benefit Templates</CardTitle>
          <CardDescription>Pre-configured benefit options</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Cashback Bonus', type: '%', default: '5%' },
            { name: 'Monthly Bonus', type: '$', default: '$100' },
            { name: 'Birthday Bonus', type: '$', default: '$50' },
            { name: 'Free Plays', type: 'Spins', default: '50' },
            { name: 'Tournament Entry', type: 'Free', default: 'Unlimited' },
            { name: 'Priority Support', type: 'Service', default: '24/7' }
          ].map((benefit) => (
            <div key={benefit.name} className="p-3 bg-muted/30 rounded border border-border flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{benefit.name}</p>
                <p className="text-xs text-muted-foreground">{benefit.type}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8">Add</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
