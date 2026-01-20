import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  UserCircle,
  Shield,
  Search,
  UserX,
} from 'lucide-react';
import Drawer from '../components/Drawer';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { User, Role, Permission, ActivityLog, MODULES } from '../types/user';
import { MasterAPI, RoleAPI, UserAPI } from '../lib/api';

type TabType = 'users' | 'roles' | 'activity';

export function Users() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [userDrawer, setUserDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [roleModal, setRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role_id: '',
    associated_industry: '',
    associated_vendor: '',
    associated_brand: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [roleForm, setRoleForm] = useState({
    role_name: '',
    role_description: '',
  });

  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [industries, setIndustries] = useState<Array<{ industry_code: string; industry_name: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ vendor_code: string; vendor_name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ brand_code: string; brand_name: string }>>([]);

  useEffect(() => {
    loadData();
    loadMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        UserAPI.getAll(),
        RoleAPI.getAll(),
        RoleAPI.getPermissions(),
      ]);

      if (usersData) {
        const usersWithRoles = usersData.map((user: any) => {
          const role = rolesData?.find((r: any) => r.id === user.role_id);
          return { ...user, role_name: role?.role_name || 'No Role' };
        });
        setUsers(usersWithRoles);
      }
      if (rolesData) setRoles(rolesData);
      if (permsData) setPermissions(permsData);
    } catch (error: any) {
      setToast({ message: "Failed to load user data", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

const loadMetadata = async () => {
    try {
      const [industriesData, vendorsData, brandsData] = await Promise.all([
        MasterAPI.getIndustries(),
        MasterAPI.getVendors(),
        MasterAPI.getBrands(),
      ]);

      setIndustries(industriesData || []);
      setVendors(vendorsData || []);
      setBrands(brandsData || []);
    } catch (error: any) {
      console.error('Error loading metadata:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const data = await UserAPI.getActivityLogs();
      if (data) setActivityLogs(data);
    } catch (error: any) {
      setToast({ message: "Failed to load activity logs", type: 'error' });
    }
  };

  const handleOpenUserDrawer = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        role_id: user.role_id,
        associated_industry: user.associated_industry || '',
        associated_vendor: user.associated_vendor || '',
        associated_brand: user.associated_brand || '',
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        full_name: '',
        email: '',
        phone: '',
        role_id: '',
        associated_industry: '',
        associated_vendor: '',
        associated_brand: '',
        status: 'active',
      });
    }
    setUserDrawer(true);
  };

    const handleSaveUser = async () => {
    if (!userForm.full_name || !userForm.email || !userForm.role_id) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      if (editingUser) {
        await UserAPI.update(editingUser.id, userForm);
        setToast({ message: 'User updated successfully', type: 'success' });
      } else {
        await UserAPI.create(userForm);
        setToast({ message: 'User added successfully', type: 'success' });
      }

      setUserDrawer(false);
      loadData();
    } catch (error: any) {
      setToast({ message: error.message || "Save failed", type: 'error' });
    }
  };

 const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      await UserAPI.delete(deleteModal.user.id);

      setToast({ message: 'User deleted successfully', type: 'success' });
      setDeleteModal({ isOpen: false, user: null });
      loadData();
    } catch (error: any) {
      setToast({ message: "Delete failed", type: 'error' });
    

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await UserAPI.update(user.id,{status:newStatus})

      setToast({
        message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });
      loadData();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        role_name: role.role_name,
        role_description: role.role_description,
      });

      const rolePerms = permissions.filter((p) => p.role_id === role.id);
      const permsMap: Record<string, Permission> = {};
      rolePerms.forEach((p) => {
        permsMap[p.module_name] = p;
      });
      setRolePermissions(permsMap);
    } else {
      setEditingRole(null);
      setRoleForm({
        role_name: '',
        role_description: '',
      });

      const emptyPerms: Record<string, Permission> = {};
      MODULES.forEach((module) => {
        emptyPerms[module] = {
          id: '',
          role_id: '',
          module_name: module,
          can_view: false,
          can_edit: false,
          can_create: false,
          can_delete: false,
          can_bulk_actions: false,
          created_at: '',
          updated_at: '',
        };
      });
      setRolePermissions(emptyPerms);
    }
    setRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.role_name) {
      setToast({ message: 'Role name is required', type: 'error' });
      return;
    }

    try {
      let roleId: string;

      if (editingRole) {
        await RoleAPI.update(editingRole.id,roleForm)
        roleId = editingRole.id;
        const permsList = Object.values(rolePermissions).map(p => ({
            ...p,
            role_id: roleId
        }));
        await RoleAPI.updatePermissions(roleId,permsList)
      } else {
          const newRole = await RoleAPI.create(roleForm);
          roleId=newRole.id 
          const permsList=Object.values(rolePermissions).map(p=>({
            ...p,
            role_id:roleId
          }))
          await RoleAPI.updatePermissions(roleId,permsList)
      }

  



      setToast({
        message: editingRole ? 'Role updated successfully' : 'Role created successfully',
        type: 'success',
      });
      setRoleModal(false);
      loadData();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleUpdatePermission = (moduleName: string, field: keyof Permission, value: boolean) => {
    setRolePermissions((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [field]: value,
      },
    }));
  };

  const getSelectedRolePermissions = () => {
    if (!userForm.role_id) return [];
    return permissions.filter((p) => p.role_id === userForm.role_id);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role_id === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (activeTab === 'roles') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Manage user roles and their permissions</p>
          </div>
          <button
            onClick={() => handleOpenRoleModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Role
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Users
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Roles & Permissions</button>
          <button
            onClick={() => setActiveTab('activity')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Activity Log
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => {
                  const rolePerms = permissions.filter((p) => p.role_id === role.id);
                  const modulesCount = rolePerms.length;
                  return (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-blue-600" />
                          <span className="font-medium text-gray-900">{role.role_name}</span>
                          {role.is_super_admin && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                              Super Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{role.role_description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{modulesCount} modules configured</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRoleModal(role)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          disabled={role.is_super_admin}
                          title={role.is_super_admin ? 'Cannot edit Super Admin role' : 'Edit role'}
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={roleModal}
          onClose={() => setRoleModal(false)}
          title={editingRole ? 'Edit Role' : 'Add Role'}
          size="large"
          actions={
            <>
              <button
                onClick={() => setRoleModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Role
              </button>
            </>
          }
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
                <input
                  type="text"
                  value={roleForm.role_name}
                  onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  placeholder="e.g., Content Manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={roleForm.role_description}
                  onChange={(e) => setRoleForm({ ...roleForm, role_description: e.target.value })}
                  placeholder="Describe this role's responsibilities"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                        Module
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                        View
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                        Edit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                        Create
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                        Delete
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                        Bulk Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MODULES.map((module) => {
                      const perm = rolePermissions[module] || {
                        can_view: false,
                        can_edit: false,
                        can_create: false,
                        can_delete: false,
                        can_bulk_actions: false,
                      };
                      return (
                        <tr key={module} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                            {module}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_view}
                              onChange={(e) =>
                                handleUpdatePermission(module, 'can_view', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_edit}
                              onChange={(e) =>
                                handleUpdatePermission(module, 'can_edit', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_create}
                              onChange={(e) =>
                                handleUpdatePermission(module, 'can_create', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_delete}
                              onChange={(e) =>
                                handleUpdatePermission(module, 'can_delete', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_bulk_actions}
                              onChange={(e) =>
                                handleUpdatePermission(module, 'can_bulk_actions', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (activeTab === 'activity') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600 mt-1">Track user actions and system events</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Roles & Permissions
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Activity Log</button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No activity logs found
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserCircle size={16} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{log.user_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 capitalize">{log.module_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{log.entity_reference || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their access</p>
        </div>
        <button
          onClick={() => handleOpenUserDrawer()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Users</button>
        <button
          onClick={() => setActiveTab('roles')}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Activity Log
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserCircle size={20} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        <Shield size={12} />
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenUserDrawer(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <UserX size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, user })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        isOpen={userDrawer}
        onClose={() => setUserDrawer(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={userForm.role_id}
              onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          {userForm.role_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Role Permissions Preview</h4>
              <div className="space-y-1">
                {getSelectedRolePermissions().map((perm) => (
                  <div key={perm.module_name} className="text-xs text-blue-800 capitalize">
                    <span className="font-medium">{perm.module_name}:</span>{' '}
                    {perm.can_view && 'View'} {perm.can_edit && '• Edit'} {perm.can_create && '• Create'}{' '}
                    {perm.can_delete && '• Delete'}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Associated Industry</label>
            <select
              value={userForm.associated_industry}
              onChange={(e) => setUserForm({ ...userForm, associated_industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {industries.map((industry) => (
                <option key={industry.industry_code} value={industry.industry_code}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Associated Vendor</label>
            <select
              value={userForm.associated_vendor}
              onChange={(e) => setUserForm({ ...userForm, associated_vendor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendor_code} value={vendor.vendor_code}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Associated Brand</label>
            <select
              value={userForm.associated_brand}
              onChange={(e) => setUserForm({ ...userForm, associated_brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {brands.map((brand) => (
                <option key={brand.brand_code} value={brand.brand_code}>
                  {brand.brand_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={userForm.status}
              onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setUserDrawer(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        title="Delete User"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, user: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete user{' '}
          <span className="font-semibold">{deleteModal.user?.full_name}</span>? This action cannot be undone.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
 }
}
