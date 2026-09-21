export default function ImageModal({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div className="img-modal-overlay" onClick={onClose}>
      <img className="img-modal-img" src={src} alt={alt || ""} />
      <button className="img-modal-close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
