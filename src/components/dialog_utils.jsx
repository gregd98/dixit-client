import React from 'react';

export const ConfirmationDialog = (input) => {
  const {
    id, text, btnText, btnHandler, errorMessage, isLoading,
  } = input;
  let { btnType } = input;
  if (!btnType) {
    btnType = 'primary';
  }
  return (
    <div className="modal fade" id={id} data-keyboard="false" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content darkBg">
          <div className="modal-body">
            <p className="text-light text-center" style={{ fontSize: '1.25rem' }}>{text}</p>
            <div className="d-flex justify-content-center mt-4">
              <button onClick={btnHandler} type="button" className={`btn btn-${btnType}`} disabled={isLoading}>
                {isLoading && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                {btnText}
              </button>
              <button type="button" className="btn btn-outline-light ml-2" data-bs-dismiss="modal">Cancel</button>
            </div>
            {errorMessage && <div className="alert alert-danger mt-4 mb-0" role="alert">{errorMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
