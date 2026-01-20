import { useEffect, useState } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, Building2 } from 'lucide-react';
import { Vendor } from '../types/vendor';
import Drawer from '../components/Drawer';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import DataTable from '../components/DataTable';
import { exportToCSV, parseCSV } from '../utils/csvHelper';
import { MasterAPI, ProductAPI } from '../lib/api';

export function VendorMaster() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; vendor: Vendor | null }>({
    isOpen: false,
    vendor: null,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sortKey, setSortKey] = useState('vendor_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendor_name: '',
    contact_email: '',
    contact_phone: '',
    vendor_website: '',
    business_type: '',
    industry: '',
    description: '',
    address: '',
    city: '',
    tax_info: '',
    vendor_logo_url: '',
    dept1_poc_name: '',
    dept1_email: '',
    dept1_phone: '',
    dept2_poc_name: '',
    dept2_email: '',
    dept2_phone: '',
    dept3_poc_name: '',
    dept3_email: '',
    dept3_phone: '',
    dept4_poc_name: '',
    dept4_email: '',
    dept4_phone: '',
    dept5_poc_name: '',
    dept5_email: '',
    dept5_phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterAndSortVendors();
  }, [vendors, searchTerm, businessTypeFilter, industryFilter, sortKey, sortDirection]);

  const loadVendors = async () => {
    try {
      setLoading(true)
    
      const data=await MasterAPI.getVendors()
      setVendors(data || []);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVendors = () => {
    let filtered = [...vendors];

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (businessTypeFilter) {
      filtered = filtered.filter((v) => v.business_type === businessTypeFilter);
    }

    if (industryFilter) {
      filtered = filtered.filter((v) => v.industry === industryFilter);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Vendor] || '';
      const bVal = b[sortKey as keyof Vendor] || '';
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredVendors(filtered);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_name?.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    if (!formData.contact_email?.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    if (!formData.contact_phone?.trim()) {
      newErrors.contact_phone = 'Contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingVendor) {
        await MasterAPI.update('vendors',editingVendor.vendor_code,formData)


        setToast({ message: 'Vendor updated successfully', type: 'success' });
      } else {
        await MasterAPI.create('vendors',formData)
        setToast({ message: 'Vendor added successfully', type: 'success' });
      }

      setIsDrawerOpen(false);
      setEditingVendor(null);
      resetForm();
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.vendor) return;

    try {
     const products=await ProductAPI.getAll(0,1,{vendor_name:deleteModal.vendor.vendor_name})

      if (products && products.length > 0) {
        setToast({
          message: 'Cannot delete vendor. It is linked to products.',
          type: 'error',
        });
        setDeleteModal({ isOpen: false, vendor: null });
        return;
      }



      setToast({ message: 'Vendor deleted successfully', type: 'success' });
      setDeleteModal({ isOpen: false, vendor: null });
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_code: '',
      vendor_name: '',
      contact_email: '',
      contact_phone: '',
      vendor_website: '',
      business_type: '',
      industry: '',
      description: '',
      address: '',
      city: '',
      tax_info: '',
      vendor_logo_url: '',
      dept1_poc_name: '',
      dept1_email: '',
      dept1_phone: '',
      dept2_poc_name: '',
      dept2_email: '',
      dept2_phone: '',
      dept3_poc_name: '',
      dept3_email: '',
      dept3_phone: '',
      dept4_poc_name: '',
      dept4_email: '',
      dept4_phone: '',
      dept5_poc_name: '',
      dept5_email: '',
      dept5_phone: '',
    });
    setErrors({});
  };

  const handleExport = () => {
    if (filteredVendors.length === 0) {
      setToast({ message: 'No data to export', type: 'error' });
      return;
    }
    exportToCSV(filteredVendors, 'vendors.csv');
    setToast({ message: 'Vendors exported successfully', type: 'success' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      const validData: Partial<Vendor>[] = [];
      const importErrors: string[] = [];
      const validColumns = [
        'vendor_code', 'vendor_name', 'contact_email', 'contact_phone', 'vendor_website',
        'business_type', 'industry', 'description', 'address', 'city', 'tax_info', 'vendor_logo_url',
        'dept1_poc_name', 'dept1_email', 'dept1_phone',
        'dept2_poc_name', 'dept2_email', 'dept2_phone',
        'dept3_poc_name', 'dept3_email', 'dept3_phone',
        'dept4_poc_name', 'dept4_email', 'dept4_phone',
        'dept5_poc_name', 'dept5_email', 'dept5_phone'
      ];

      data.forEach((row, index) => {
        const rowErrors: string[] = [];

        const vendor_name = row.vendor_name ? String(row.vendor_name).trim() : '';
        const contact_email = row.contact_email ? String(row.contact_email).trim() : '';
        const contact_phone = row.contact_phone ? String(row.contact_phone).trim() : '';

        if (!vendor_name) {
          rowErrors.push('vendor_name is required');
        }
        if (!contact_email) {
          rowErrors.push('contact_email is required');
        } else if (!/\S+@\S+\.\S+/.test(contact_email)) {
          rowErrors.push('invalid email format');
        }
        if (!contact_phone) {
          rowErrors.push('contact_phone is required');
        }

        if (rowErrors.length > 0) {
          importErrors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
        } else {
          const vendorData: any = {};
          validColumns.forEach(col => {
            if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
              let value = typeof row[col] === 'number' ? String(row[col]) : row[col];
              if (col === 'business_type' && typeof value === 'string') {
                value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              }
              vendorData[col] = value;
            }
          });

          if (vendorData.vendor_code === '' || vendorData.vendor_code === undefined) {
            delete vendorData.vendor_code;
          }
          validData.push(vendorData);
        }
      });

      if (importErrors.length > 0) {
        setToast({ message: `Import failed: ${importErrors.join('; ')}`, type: 'error' });
        return;
      }

      let count=0
      for (const vendor of validData)
      {
        await MasterAPI.create('vendors',vendor)
        count++
      }

       setToast({ message: `${count} vendors imported successfully`, type: 'success' });
      loadVendors();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }

    e.target.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      {
        vendor_name: 'Example Vendor',
        contact_email: 'contact@example.com',
        contact_phone: '555-1234',
        vendor_website: 'https://example.com',
        business_type: 'Wholesaler',
        industry: 'HVAC',
        description: 'Sample description',
        address: '123 Main St',
        city: 'New York',
        tax_info: 'TAX123',
        vendor_logo_url: '',
        dept1_poc_name: 'John Doe',
        dept1_email: 'john@example.com',
        dept1_phone: '555-1111',
        dept2_poc_name: '',
        dept2_email: '',
        dept2_phone: '',
        dept3_poc_name: '',
        dept3_email: '',
        dept3_phone: '',
        dept4_poc_name: '',
        dept4_email: '',
        dept4_phone: '',
        dept5_poc_name: '',
        dept5_email: '',
        dept5_phone: '',
      },
    ];
    exportToCSV(template, 'vendor_import_template.csv');
  };

  const getDepartmentCount = (vendor: Vendor) => {
    let count = 0;
    if (vendor.dept1_poc_name) count++;
    if (vendor.dept2_poc_name) count++;
    if (vendor.dept3_poc_name) count++;
    if (vendor.dept4_poc_name) count++;
    if (vendor.dept5_poc_name) count++;
    return count;
  };

  const columns = [
    { key: 'vendor_code', label: 'Vendor Code', sortable: true },
    { key: 'vendor_name', label: 'Vendor Name', sortable: true },
    { key: 'business_type', label: 'Business Type', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'contact_email', label: 'Email', sortable: false },
    { key: 'contact_phone', label: 'Phone', sortable: false },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Vendor) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, vendor: row })}
            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Master</h1>
          <p className="text-gray-600 mt-1">Manage vendor information and contacts</p>
        </div>
        <button
          onClick={() => {
            setEditingVendor(null);
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search vendor code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={businessTypeFilter}
            onChange={(e) => setBusinessTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Business Types</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Distributor">Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Retailer">Retailer</option>
          </select>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Industries</option>
            <option value="HVAC">HVAC</option>
            <option value="Furniture">Furniture</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety Supplies">Safety Supplies</option>
            <option value="Hardware">Hardware</option>
            <option value="Tools & Equipments">Tools & Equipments</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Home Improvements">Home Improvements</option>
            <option value="Home & Decor">Home & Decor</option>
            <option value="Industrial Supplies">Industrial Supplies</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={20} />
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload size={20} />
              Import
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download Template"
            >
              <Building2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredVendors}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={(key) => {
          if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortKey(key);
            setSortDirection('asc');
          }
        }}
        isLoading={loading}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingVendor(null);
          resetForm();
        }}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {editingVendor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_code || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated upon creation</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vendor_name && <p className="text-red-500 text-sm mt-1">{errors.vendor_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.contact_email && <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.contact_phone && <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Dealer">Dealer</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Safety Supplies">Safety Supplies</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Tools & Equipments">Tools & Equipments</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Home Improvements">Home Improvements</option>
                  <option value="Home & Decor">Home & Decor</option>
                  <option value="Industrial Supplies">Industrial Supplies</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={formData.vendor_website}
                  onChange={(e) => setFormData({ ...formData, vendor_website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Info</label>
                <input
                  type="text"
                  value={formData.tax_info}
                  onChange={(e) => setFormData({ ...formData, tax_info: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={formData.vendor_logo_url}
                  onChange={(e) => setFormData({ ...formData, vendor_logo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((dept) => (
            <div key={dept} className="space-y-4">
              <h3 className="font-semibold text-gray-900">Department {dept} Contact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POC Name</label>
                  <input
                    type="text"
                    value={formData[`dept${dept}_poc_name` as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [`dept${dept}_poc_name`]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData[`dept${dept}_email` as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [`dept${dept}_email`]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData[`dept${dept}_phone` as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [`dept${dept}_phone`]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingVendor(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingVendor ? 'Update' : 'Add'} Vendor
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, vendor: null })}
        title="Delete Vendor"
        actions={
          <>
            <button
              onClick={() => setDeleteModal({ isOpen: false, vendor: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete vendor{' '}
          <span className="font-semibold">{deleteModal.vendor?.vendor_name}</span>? This action
          cannot be undone.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
