import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, HelpCircle, Clock, CheckCircle } from 'lucide-react';

export default function Support() {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3"><HelpCircle className="w-10 h-10 text-primary" />Support Center</h1>
          <p className="text-muted-foreground mt-2">Get help and support from our team</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'faq', label: 'FAQ' },
            { id: 'tickets', label: 'My Tickets' },
            { id: 'contact', label: 'Contact Us' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            {[
              { q: 'How do I deposit funds?', a: 'You can deposit using credit card, bank transfer, or cryptocurrency. Go to Wallet and click Deposit.' },
              { q: 'What is the minimum withdrawal amount?', a: 'The minimum withdrawal is $10. Withdrawals are processed within 1-3 business days.' },
              { q: 'How do bonuses work?', a: 'Bonuses are automatically credited after deposits or meeting certain conditions. Check your bonus history for details.' },
              { q: 'Can I play on mobile?', a: 'Yes! Our platform is fully optimized for mobile devices. Download our app or use the mobile web version.' },
              { q: 'What is responsible gaming?', a: 'We offer tools to help you play safely, including deposit limits, session timers, and self-exclusion options.' }
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <p className="font-bold mb-2">{faq.q}</p>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            {[
              { id: 'TK-001', subject: 'Bonus not received', status: 'Resolved', created: '1 day ago' },
              { id: 'TK-002', subject: 'Withdrawal pending', status: 'In Progress', created: '3 hours ago' },
              { id: 'TK-003', subject: 'Account verification', status: 'Open', created: 'Just now' }
            ].map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{ticket.id}: {ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">{ticket.created}</p>
                  </div>
                  <Badge className={
                    ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-500' :
                    ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-orange-500/10 text-orange-500'
                  } style={{borderStyle: 'none'}}>
                    {ticket.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            <Button className="w-full font-bold"><MessageSquare className="w-4 h-4 mr-2" />Create New Ticket</Button>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { method: 'Email', value: 'support@coinkrazy.ai', icon: '📧' },
                { method: 'Live Chat', value: 'Available 24/7', icon: '💬' },
                { method: 'Phone', value: '+1 (555) 123-4567', icon: '📞' }
              ].map((contact) => (
                <Card key={contact.method}>
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl mb-3">{contact.icon}</p>
                    <p className="font-bold">{contact.method}</p>
                    <p className="text-sm text-muted-foreground mt-1">{contact.value}</p>
                    <Button variant="outline" className="w-full mt-4 h-8">Contact</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-bold mb-2 block">Subject</label>
                  <Input placeholder="How can we help?" className="bg-muted/50" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-2 block">Message</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-mono" rows={5} placeholder="Describe your issue..." />
                </div>
                <Button className="font-bold">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Response Time Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 flex items-center gap-4">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold">Average Response Time</p>
              <p className="text-sm text-muted-foreground">We typically respond within 2 hours during business hours (9 AM - 6 PM EST)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
