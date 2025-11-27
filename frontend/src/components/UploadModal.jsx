import React, { useState } from 'react';
import { X, Upload, FileText, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { BlurFade } from './ui/blur-fade';

function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [policyId, setPolicyId] = useState('policy-healthcare-001');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid JSON file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadStatus('encrypting');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ownerId', localStorage.getItem('userId') || 'org1');
      formData.append('policyId', policyId);

      setUploadStatus('uploading');

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadStatus('success');
      
      setTimeout(() => {
        onUploadSuccess(result);
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPolicyId('policy-healthcare-001');
    setUploading(false);
    setUploadStatus(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <BlurFade>
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Healthcare Record</h2>
                <p className="text-gray-400 text-sm">Securely encrypted before upload</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              uploadStatus === 'success' 
                ? 'bg-green-500/10 border-green-500/50 text-green-200'
                : uploadStatus === 'error'
                ? 'bg-red-500/10 border-red-500/50 text-red-200'
                : 'bg-blue-500/10 border-blue-500/50 text-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                {uploadStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Record uploaded successfully!</span>
                  </>
                ) : uploadStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>Upload failed. Please try again.</span>
                  </>
                ) : uploadStatus === 'encrypting' ? (
                  <>
                    <Lock className="w-5 h-5 animate-pulse" />
                    <span>Encrypting with AES-256-GCM...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 animate-bounce" />
                    <span>Uploading to secure storage...</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                FHIR Record (JSON)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    file
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/20 hover:border-white/40 bg-white/5'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-green-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div className="text-center">
                        <p className="text-white font-medium">Click to upload or drag and drop</p>
                        <p className="text-gray-400 text-sm">JSON files only</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Access Policy ID
              </label>
              <input
                type="text"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                placeholder="e.g., policy-healthcare-001"
              />
            </div>

            {/* Encryption Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-purple-200 font-medium mb-1">End-to-End Encryption</p>
                  <p className="text-purple-300/70">
                    Your data is encrypted with AES-256-GCM before leaving your browser. 
                    Keys are wrapped using KMS and stored securely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload & Encrypt</span>
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}

export default UploadModal;

