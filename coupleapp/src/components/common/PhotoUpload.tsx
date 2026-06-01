import { useState, useRef } from 'react';
import './PhotoUpload.css';

interface PhotoUploadProps {
    onPhotosSelected: (files: File[]) => void;
    onUploadComplete: (files: File[]) => Promise<void>;
    loading?: boolean;
}

export default function PhotoUpload({
    onPhotosSelected,
    onUploadComplete,
    loading = false,
}: PhotoUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));

        if (fileArray.length === 0) {
            setError('Chỉ chấp nhận file ảnh');
            return;
        }

        if (fileArray.length < 3) {
            setError(`Vui lòng chọn ít nhất 3 ảnh (hiện có ${fileArray.length})`);
            return;
        }

        if (fileArray.length > 10) {
            setError('Tối đa 10 ảnh');
            return;
        }

        // Validate file sizes
        const maxSize = 5 * 1024 * 1024; // 5MB
        for (const file of fileArray) {
            if (file.size > maxSize) {
                setError(`File ${file.name} quá lớn (tối đa 5MB)`);
                return;
            }
        }

        setSelectedFiles(fileArray);
        onPhotosSelected(fileArray);
        setError('');

        // Generate previews
        const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current?.classList.add('dragover');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current?.classList.remove('dragover');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current?.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length < 3) {
            setError('Vui lòng chọn ít nhất 3 ảnh');
            return;
        }

        setUploadProgress(0);
        setError('');

        try {
            await onUploadComplete(selectedFiles);
        } catch (err: any) {
            setError(err.message || 'Lỗi upload ảnh');
        }
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        // Revoke old preview URL
        URL.revokeObjectURL(previews[index]);

        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
        onPhotosSelected(newFiles);

        if (newFiles.length < 3) {
            setError('Vui lòng chọn ít nhất 3 ảnh');
        } else {
            setError('');
        }
    };

    return (
        <div className="photo-upload">
            {selectedFiles.length === 0 ? (
                <div
                    ref={dragRef}
                    className="upload-area"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon">📷</div>
                    <h3>Kéo thả ảnh vào đây</h3>
                    <p>hoặc nhấp để chọn ảnh</p>
                    <p className="requirement">Tối thiểu 3 ảnh (tối đa 5MB mỗi ảnh)</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <div className="upload-preview">
                    <div className="preview-grid">
                        {previews.map((preview, index) => (
                            <div key={index} className="preview-item">
                                <img src={preview} alt={`Preview ${index + 1}`} />
                                <button
                                    className="remove-btn"
                                    onClick={() => removeFile(index)}
                                    disabled={loading}
                                >
                                    ✕
                                </button>
                                <span className="preview-number">{index + 1}</span>
                            </div>
                        ))}
                    </div>

                    <div className="upload-actions">
                        <button
                            className="btn-select-more"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading || selectedFiles.length >= 10}
                        >
                            Thêm ảnh
                        </button>
                        <button
                            className="btn-upload"
                            onClick={handleUpload}
                            disabled={loading || selectedFiles.length < 3}
                        >
                            {loading ? `Đang upload... ${uploadProgress}%` : 'Upload ảnh'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <p className="file-count">
                        {selectedFiles.length} ảnh được chọn {selectedFiles.length < 3 && '(cần ít nhất 3)'}
                    </p>
                </div>
            )}

            {error && <div className="upload-error">{error}</div>}
        </div>
    );
}
