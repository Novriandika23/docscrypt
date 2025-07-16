import { useState } from 'react';
import { 
  Upload as UploadIcon, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { encryptionAPI } from '../services/api';
import toast from 'react-hot-toast';

const Decrypt = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [decryptResult, setDecryptResult] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file extension
      if (!file.name.endsWith('.encrypted')) {
        toast.error('Silakan pilih file .encrypted');
        return;
      }
      
      setSelectedFile(file);
      setDecryptResult(null);
      
      // Try to extract original filename
      const baseName = file.name.replace('.encrypted', '');
      setOriginalFileName(baseName);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.encrypted')) {
        toast.error('Silakan pilih file .encrypted');
        return;
      }
      
      setSelectedFile(file);
      setDecryptResult(null);
      
      const baseName = file.name.replace('.encrypted', '');
      setOriginalFileName(baseName);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const decryptFile = async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (originalFileName) {
        formData.append('originalFileName', originalFileName);
      }

      const response = await encryptionAPI.decryptUpload(formData);
      
      if (response.data.success) {
        setDecryptResult(response.data);
        toast.success('File berhasil didekripsi!');
      } else {
        toast.error(response.data.message || 'Dekripsi gagal');
      }
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error(error.response?.data?.message || 'Dekripsi gagal');
    } finally {
      setUploading(false);
    }
  };

  const downloadDecrypted = async () => {
    if (!decryptResult) return;

    try {
      const response = await encryptionAPI.downloadDecrypted(decryptResult.downloadUrl.split('/').pop());
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decryptResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File berhasil diunduh!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Unduh gagal');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setDecryptResult(null);
    setOriginalFileName('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dekripsi File</h1>
        <p className="text-gray-600">Unggah dan dekripsi file .encrypted</p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Unlock className="h-5 w-5 mr-2 text-blue-500" />
            Unggah File Terenkripsi
          </h3>
        </div>
        <div className="card-content">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drop your .encrypted file here
              </p>
              <p className="text-gray-500">
                or click to browse
              </p>
              <input
                type="file"
                accept=".encrypted"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="btn-primary inline-flex items-center cursor-pointer"
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Pilih File
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Hanya file .encrypted yang didukung
            </p>
          </div>
        </div>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">File Terpilih</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Original Filename Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama File Asli (opsional)
              </label>
              <input
                type="text"
                value={originalFileName}
                onChange={(e) => setOriginalFileName(e.target.value)}
                placeholder="contoh: dokumen.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Jika tidak disediakan, akan diekstrak dari nama file
              </p>
            </div>

            {/* Decrypt Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={decryptFile}
                disabled={uploading}
                className="btn-primary flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mendekripsi...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Dekripsi File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decryption Result */}
      {decryptResult && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Dekripsi Berhasil
            </h3>
          </div>
          <div className="card-content">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">
                    File decrypted successfully!
                  </h4>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Filename:</strong> {decryptResult.fileName}</p>
                    <p><strong>Size:</strong> {formatFileSize(decryptResult.fileSize)}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={downloadDecrypted}
                      className="btn-primary text-sm flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Unduh File Terdekripsi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
            Cara Penggunaan
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                1
              </span>
              <p>Unggah file .encrypted yang diunduh dari sistem ini</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                2
              </span>
              <p>Klik "Dekripsi File" untuk memproses data terenkripsi</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                3
              </span>
              <p>Unduh file terdekripsi setelah pemrosesan selesai</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Catatan Penting:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Hanya file yang dienkripsi oleh sistem ini yang dapat didekripsi</li>
                  <li>Kunci enkripsi harus sesuai dengan yang digunakan saat enkripsi</li>
                  <li>File terdekripsi disimpan sementara dan dibersihkan secara otomatis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Decrypt;
