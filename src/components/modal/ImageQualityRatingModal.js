import React, { useState, useEffect } from 'react';
import './ImageQualityRatingModal.css';
import { logEvent } from '../../api/logEvent';

const ImageQualityRatingModal = ({ isOpen, onClose, imageUrl, onRatingSubmit }) => {
  const [selectedRating, setSelectedRating] = useState(null);

  useEffect(() => {
    if (isOpen) {
      logEvent("image_quality_modal.opened", {
        // image_url: imageUrl,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isOpen, imageUrl]);

  // ESC 키 방지
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        logEvent("image_quality_modal.escape_attempted", {
          selected_rating: selectedRating,
          // image_url: imageUrl,
        });
        alert("⚠️ 품질 평가가 필요합니다!\n\n생성된 이미지의 품질을 1-7점으로 평가한 후 '평가 완료' 버튼을 눌러주세요.");
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, selectedRating, imageUrl]);

  const handleRatingClick = (rating) => {
    logEvent("image_quality_modal.rating_selected", {
      rating: rating,
      previous_rating: selectedRating,
      // image_url: imageUrl,
    });
    setSelectedRating(rating);
  };

  const handleSubmit = () => {
    if (selectedRating) {
      logEvent("image_quality_modal.rating_submitted", {
        rating: selectedRating,
        // image_url: imageUrl,
        timestamp: new Date().toISOString(),
      });
      onRatingSubmit(selectedRating);
      setSelectedRating(null);
      onClose();
    }
  };

  const handleCancel = () => {
    logEvent("image_quality_modal.cancel_attempted", {
      selected_rating: selectedRating,
      // image_url: imageUrl,
      timestamp: new Date().toISOString(),
    });
    
    // 경고 메시지 표시
    alert("⚠️ 품질 평가가 필요합니다!\n\n생성된 이미지의 품질을 1-7점으로 평가한 후 '평가 완료' 버튼을 눌러주세요.");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => {
      logEvent("image_quality_modal.backdrop_clicked", {
        selected_rating: selectedRating,
        // image_url: imageUrl,
      });
      handleCancel();
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>이미지 품질 평가</h3>
          <button className="close-button disabled-close" onClick={handleCancel} title="평가를 완료해야 닫을 수 있습니다">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="image-container">
            <img src={imageUrl} alt="Generated" className="generated-image" />
          </div>
          
          <div className="rating-section">
            <p><strong>생성된 이미지의 품질을 1-7점으로 평가해주세요:</strong></p>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 16px 0' }}>
              ※ 평가는 필수이며, 평가 완료 후에만 창을 닫을 수 있습니다.
            </p>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
                <button
                  key={rating}
                  className={`rating-button ${selectedRating === rating ? 'selected' : ''}`}
                  onClick={() => handleRatingClick(rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>매우나쁨</span>
              <span>매우좋음</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button disabled-cancel" onClick={handleCancel} title="평가를 완료해야 닫을 수 있습니다">
            평가 필수
          </button>
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={!selectedRating}
          >
            평가 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageQualityRatingModal;