import React, { useEffect, useState } from 'react';

interface SafeImageProps {
  imagePath: string;
  alt: string;
  className?: string;
  loadingText?: string;
  errorText?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  imagePath, 
  alt, 
  className = '', 
  loadingText = '載入中...',
  errorText = '圖片載入失敗'
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const imageData = await window.electronAPI.getImageData(imagePath);
        if (imageData) {
          setImageSrc(imageData);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imagePath]);

  if (loading) {
    return (
      <div className={`${className} safe-image-placeholder`} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f0f0f0' 
      }}>
        {loadingText}
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`${className} safe-image-placeholder`} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f0f0f0' 
      }}>
        {errorText}
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
};