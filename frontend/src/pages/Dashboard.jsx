import { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Download,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { fileAPI, encryptionAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingFiles, setProcessingFiles] = useState(new Set());

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileAPI.list();
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Gagal memuat file');
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async (fileId) => {
    try {
      setProcessingFiles(prev => new Set(prev).add(fileId));
      const response = await encryptionAPI.encrypt(fileId);
      
      if (response.data.success) {
        toast.success('File berhasil dienkripsi!');
        loadFiles(); // Reload files to update status
      } else {
        toast.error(response.data.message || 'Enkripsi gagal');
      }
    } catch (error) {
      console.error('Encryption error:', error);
      toast.error(error.response?.data?.message || 'Enkripsi gagal');
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDecrypt = async (fileId) => {
    try {
      setProcessingFiles(prev => new Set(prev).add(fileId));
      const response = await encryptionAPI.decrypt(fileId);
      
      if (response.data.success) {
        toast.success('File berhasil didekripsi!');
        // Note: File remains encrypted in storage, this just verifies decryption works
      } else {
        toast.error(response.data.message || 'Dekripsi gagal');
      }
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error(error.response?.data?.message || 'Dekripsi gagal');
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      setProcessingFiles(prev => new Set(prev).add(fileId));
      const response = await encryptionAPI.download(fileId);

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File berhasil diunduh!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Unduh gagal');
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDownloadEncrypted = async (fileId, fileName) => {
    try {
      setProcessingFiles(prev => new Set(prev).add(fileId));
      const response = await encryptionAPI.downloadEncrypted(fileId);

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.encrypted`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File terenkripsi berhasil diunduh!');
    } catch (error) {
      console.error('Download encrypted error:', error);
      toast.error(error.response?.data?.message || 'Unduh file terenkripsi gagal');
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) {
      return;
    }

    try {
      setProcessingFiles(prev => new Set(prev).add(fileId));
      const response = await fileAPI.delete(fileId);
      
      if (response.data.success) {
        toast.success('File berhasil dihapus!');
        loadFiles(); // Reload files
      } else {
        toast.error(response.data.message || 'Hapus gagal');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Hapus gagal');
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();

    switch (extension) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getStatusBadge = (isEncrypted) => {
    if (isEncrypted) {
      return (
        <span className="status-badge encrypted">
          <Lock className="h-3 w-3 mr-1" />
          Terenkripsi
        </span>
      );
    } else {
      return (
        <span className="status-badge unencrypted">
          <Unlock className="h-3 w-3 mr-1" />
          Belum Terenkripsi
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Memuat file...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Beranda File</h1>
            <p className="text-primary-100">Kelola file terenkripsi Anda dengan aman</p>
          </div>
          <div className="hidden md:block">
            <img
              src="/logo-tanpa-bg.png"
              alt="DocsCrypt"
              className="h-12 w-12 opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={loadFiles}
            className="btn-outline flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-secondary-500 bg-gradient-to-r from-secondary-50 to-white min-h-[120px]">
          <div className="card-content h-full flex items-center">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="p-3 bg-secondary-100 rounded-xl shadow-sm">
                  <FileText className="h-8 w-8 text-secondary-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Total File</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">{files.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-primary-500 bg-gradient-to-r from-primary-50 to-white min-h-[120px]">
          <div className="card-content h-full flex items-center">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 rounded-xl shadow-sm">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Terenkripsi</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">
                  {files.filter(f => f.is_encrypted).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-white min-h-[120px]">
          <div className="card-content h-full flex items-center">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-xl shadow-sm">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Belum Terenkripsi</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">
                  {files.filter(f => !f.is_encrypted).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">File Anda</h3>
        </div>
        <div className="card-content">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada file</h3>
              <p className="mt-1 text-sm text-gray-500">
                Mulai dengan mengunggah file pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ukuran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diunggah
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(file.original_name)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {file.original_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                          .{file.file_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(file.is_encrypted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!file.is_encrypted ? (
                            <button
                              onClick={() => handleEncrypt(file.id)}
                              disabled={processingFiles.has(file.id)}
                              className="btn-primary text-xs"
                              title="Enkripsi file"
                            >
                              {processingFiles.has(file.id) ? (
                                <div className="loading-spinner"></div>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Enkripsi
                                </>
                              )}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleDecrypt(file.id)}
                                disabled={processingFiles.has(file.id)}
                                className="btn-secondary text-xs"
                                title="Tes dekripsi"
                              >
                                {processingFiles.has(file.id) ? (
                                  <div className="loading-spinner"></div>
                                ) : (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Tes
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownload(file.id, file.original_name)}
                                disabled={processingFiles.has(file.id)}
                                className="btn-outline text-xs"
                                title="Unduh file terdekripsi"
                              >
                                {processingFiles.has(file.id) ? (
                                  <div className="loading-spinner"></div>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Unduh
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadEncrypted(file.id, file.original_name)}
                                disabled={processingFiles.has(file.id)}
                                className="btn-secondary text-xs"
                                title="Unduh file terenkripsi (data mentah terenkripsi)"
                              >
                                {processingFiles.has(file.id) ? (
                                  <div className="loading-spinner"></div>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Mentah
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(file.id)}
                            disabled={processingFiles.has(file.id)}
                            className="btn-danger text-xs"
                            title="Hapus file"
                          >
                            {processingFiles.has(file.id) ? (
                              <div className="loading-spinner"></div>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
