import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import styles from './ReceiptScannerModal.module.css';

export function ReceiptScannerModal({ isOpen, onClose, onScanComplete }) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG).');
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          const response = await fetch('/api/ai/scan-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to scan receipt');
          }

          const data = await response.json();
          // Provide defaults and map the data back to the format TransactionModal expects
          onScanComplete({
            description: data.description || '',
            date: data.date || new Date().toISOString().split('T')[0],
            amount: data.amount ? parseFloat(data.amount) : 0,
            category: data.category || 'Other',
            type: 'Debit',
            status: 'Completed'
          });
          onClose();
        } catch (err) {
          setError(err.message);
        } finally {
          setIsScanning(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsScanning(false);
      };
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsScanning(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Scan Receipt</h2>
            <span className={styles.aiBadge}>AI Powered</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={isScanning}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          
          <div 
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isScanning ? styles.scanning : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isScanning && fileInputRef.current?.click()}
          >
            {isScanning ? (
              <div className={styles.scanningState}>
                <Loader2 size={48} className={styles.spinner} />
                <h3 className={styles.scanningTitle}>Extracting Data...</h3>
                <p className={styles.scanningSubtitle}>Gemini AI is reading the vendor, date, and amount from your receipt.</p>
              </div>
            ) : (
              <div className={styles.uploadState}>
                <div className={styles.iconContainer}>
                  <UploadCloud size={40} className={styles.uploadIcon} />
                </div>
                <h3 className={styles.dropTitle}>Drag & Drop your receipt here</h3>
                <p className={styles.dropSubtitle}>Supports JPG, PNG (Max 5MB)</p>
                <div className={styles.divider}>
                  <span>OR</span>
                </div>
                <Button variant="secondary" icon={ImageIcon}>Browse Files</Button>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg, image/png, image/webp" 
              style={{ display: 'none' }}
              disabled={isScanning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
