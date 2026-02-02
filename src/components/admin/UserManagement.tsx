
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, Shield, UserPlus, Edit, Trash2, Key, Mail, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator';
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

const UserManagement = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'admin' });
  const { toast } = useToast();

  const adminUsers: AdminUser[] = [
    {
      id: '1',
      email: 'fastrackfix@gmail.com',
      role: 'owner',
      status: 'active',
      lastLogin: '2 hours ago',
      permissions: ['all']
    },
    {
      id: '2',
      email: 'admin@roofingfriend.com',
      role: 'admin',
      status: 'active',
      lastLogin: '1 day ago',
      permissions: ['crm', 'blog', 'analytics']
    },
    {
      id: '3',
      email: 'moderator@roofingfriend.com',
      role: 'moderator',
      status: 'inactive',
      lastLogin: '1 week ago',
      permissions: ['blog']
    }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Moderator</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 
      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge> :
      <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>;
  };

  const handleAddUser = () => {
    if (!newUser.email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User Invited",
      description: `Invitation sent to ${newUser.email}`,
    });

    setNewUser({ email: '', role: 'admin' });
    setShowAddDialog(false);
  };

  const handleToggleStatus = (userId: string) => {
    toast({
      title: "Status Updated",
      description: "User status has been changed",
    });
  };

  return (
    <div className="space-y-6" data-component="UserManagement" data-file="src/components/admin/UserManagement.tsx">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage admin users, their roles, and permissions
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Admin User</DialogTitle>
                  <DialogDescription>
                    Invite a new user to join the admin panel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Admin Users Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.email}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={user.role === 'owner'}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          {user.role !== 'owner' && (
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Permission Management Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-purple-700">Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Full System Access</span>
                      <Switch checked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>User Management</span>
                      <Switch checked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>System Settings</span>
                      <Switch checked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Management</span>
                      <Switch checked disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-700">Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>CRM Access</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Blog Management</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Analytics</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Project Management</span>
                      <Switch checked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-700">Moderator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Blog Management</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Content Review</span>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Basic Analytics</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lead Viewing</span>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
