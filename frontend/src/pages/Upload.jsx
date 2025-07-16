import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { fileAPI } from '../services/api';
import toast from 'react-hot-toast';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const validFiles = [];
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    Array.from(fileList).forEach(file => {
      if (allowedTypes.includes(file.type)) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'ready'
        });
      } else {
        toast.error(`${file.name} is not a valid file type. Only .docx and .xlsx files are allowed.`);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Silakan pilih file untuk diunggah');
      return;
    }

    setUploading(true);
    const uploadPromises = files.map(async (fileItem) => {
      try {
        const formData = new FormData();
        formData.append('file', fileItem.file);

        const response = await fileAPI.upload(formData);
        
        if (response.data.success) {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', uploadedFile: response.data.file }
              : f
          ));
          return { success: true, file: fileItem };
        } else {
          throw new Error(response.data.message || 'Unggah gagal');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.response?.data?.message || error.message }
            : f
        ));
        return { success: false, file: fileItem, error: error.message };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} file berhasil diunggah!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} file gagal diunggah`);
      }

      // If all files uploaded successfully, redirect to dashboard after a delay
      if (errorCount === 0) {
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      toast.error('Proses unggah gagal');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    return <FileText className="h-8 w-8 text-secondary-500" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-primary-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unggah File</h1>
        <p className="text-gray-600">Unggah file Word (.docx) dan Excel (.xlsx) untuk dienkripsi</p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-content">
          <div
            className={`file-upload-area ${dragActive ? 'dragover' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx,.xlsx"
              onChange={handleChange}
              className="hidden"
            />
            
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">
                Seret file ke sini atau klik untuk memilih
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Mendukung: Dokumen Word (.docx) dan spreadsheet Excel (.xlsx)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ukuran file maksimum: 50MB per file
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">File Terpilih</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(fileItem.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fileItem.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.size)}
                      </p>
                      {fileItem.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileItem.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileItem.status)}
                    {fileItem.status === 'ready' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setFiles([])}
                className="btn-outline"
                disabled={uploading}
              >
                Hapus Semua
              </button>
              <button
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="btn-primary flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Unggah File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card">
        <div className="card-content">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Informasi Penting</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Hanya file Word (.docx) dan Excel (.xlsx) yang didukung</p>
            <p>• Ukuran file maksimum adalah 50MB per file</p>
            <p>• File akan dienkripsi menggunakan Aria-128-CBC + Affine Cipher</p>
            <p>• Anda dapat mengunduh file terdekripsi kapan saja dari beranda</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
