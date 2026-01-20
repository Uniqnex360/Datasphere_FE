import { useEffect, useState } from 'react';
import { supabase, ImportJob, ExportJob, Channel } from '../lib/supabase';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Clock } from 'lucide-react';

export function ImportExport() {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [importRes, exportRes, channelsRes] = await Promise.all([
        supabase.from('import_jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('export_jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('channels').select('*'),
      ]);

      if (importRes.data) setImportJobs(importRes.data);
      if (exportRes.data) setExportJobs(exportRes.data);
      if (channelsRes.data) setChannels(channelsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const { error } = await supabase.from('import_jobs').insert([
        {
          file_name: 'products_import_' + new Date().getTime() + '.csv',
          file_url: '#',
          status: 'completed',
          total_rows: 100,
          processed_rows: 98,
          error_rows: 2,
          error_log: [
            { row: 45, error: 'Invalid SKU format' },
            { row: 78, error: 'Missing required field: title' },
          ],
        },
      ]);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleExport = async (channelId?: string) => {
    try {
      const { error } = await supabase.from('export_jobs').insert([
        {
          channel_id: channelId || null,
          file_name: 'products_export_' + new Date().getTime() + '.csv',
          file_url: '#',
          status: 'completed',
          total_products: 50,
          filter_criteria: {},
        },
      ]);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'failed':
        return <XCircle size={18} className="text-red-600" />;
      case 'processing':
        return <Clock size={18} className="text-orange-600 animate-spin" />;
      default:
        return <Clock size={18} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-orange-100 text-orange-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import / Export</h1>
        <p className="text-gray-600 mt-1">Import product data and export to various formats</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload size={20} />
              Import
            </div>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Download size={20} />
              Export
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <FileSpreadsheet size={48} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Import Product Data
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload a CSV or Excel file to import product information. The file should
                      include columns for SKU, title, and other product attributes.
                    </p>
                    <button
                      onClick={handleImport}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Upload size={20} />
                      Upload File
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Import History</h3>
                <div className="space-y-3">
                  {importJobs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No import jobs yet</p>
                  ) : (
                    importJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <div className="font-medium text-gray-900">{job.file_name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(job.created_at).toLocaleString()} • {job.processed_rows} /{' '}
                              {job.total_rows} rows
                              {job.error_rows > 0 && (
                                <span className="text-red-600 ml-2">
                                  {job.error_rows} errors
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Standard Export</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Export all products in CSV format with all attributes
                  </p>
                  <button
                    onClick={() => handleExport()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download size={20} />
                    Export All
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Channel Export</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Export products in channel-specific formats
                  </p>
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleExport(channel.id)}
                        className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Export for {channel.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Export History</h3>
                <div className="space-y-3">
                  {exportJobs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No export jobs yet</p>
                  ) : (
                    exportJobs.map((job) => {
                      const channel = channels.find((c) => c.id === job.channel_id);
                      return (
                        <div
                          key={job.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(job.status)}
                            <div>
                              <div className="font-medium text-gray-900">
                                {job.file_name}
                                {channel && (
                                  <span className="ml-2 text-sm text-gray-600">
                                    ({channel.name})
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(job.created_at).toLocaleString()} •{' '}
                                {job.total_products} products
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(job.status)}
                            {job.status === 'completed' && (
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
