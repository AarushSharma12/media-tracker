function Modal({ show, onHide, title, children, size = "modal-lg", footer }) {
  if (!show) return null;

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onHide();
    }
  }

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        zIndex: 1050,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      tabIndex="-1"
      onClick={handleBackdropClick}
    >
      <div className={`modal-dialog ${size} modal-dialog-centered`}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {title && (
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onHide}
                aria-label="Close"
              ></button>
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default Modal;
