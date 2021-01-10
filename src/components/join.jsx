import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Input, trimDecorator, uppercaseDecorator } from './form_utils.jsx';
import { joinConstraints as rules } from '../constraints/joinConstraints';
import { loadGameData, loadGameType } from '../actions/gameActions';
import { restPut } from '../utils/communication';
import { SERVER_PATH } from '../constants';

const validate = require('validate.js');

const Join = () => {
  const [code, setCode] = useState({ value: '', error: '' });
  const [name, setName] = useState({ value: '', error: '' });
  const [formDisabled, setFormDisabled] = useState(false);
  const [formError, setFormError] = useState('');

  const dispatch = useDispatch();

  const setterDict = { code: setCode, name: setName };

  const submitForm = (event) => {
    event.preventDefault();
    setFormError('');
    const evaluateInputErrors = (errors) => {
      Object.entries(errors).forEach(([key, value]) => {
        setterDict[key]((rest) => ({ ...rest, error: value[0] }));
      });
    };

    const body = {
      code: code.value,
      name: name.value,
    };

    const validation = validate(body, rules, { fullMessages: false });

    if (validation) {
      evaluateInputErrors(validation);
    } else {
      setFormDisabled(true);
      restPut(`${SERVER_PATH}api/player`, body).then((result) => {
        dispatch(loadGameData(result));
      }).catch((error) => {
        setFormDisabled(false);
        if (error.inputErrors) {
          evaluateInputErrors(error.inputErrors);
        } else {
          setFormError(error.message);
        }
      });
    }
  };

  const backClicked = () => {
    dispatch(loadGameType(''));
  };

  return (
    <div className="d-flex justify-content-center mb-4 mx-4">
      <div style={{ width: 500 }}>
        <p className="text-center text-light dixit-title">Join</p>
        <form onSubmit={submitForm} className="mt-5">
          <div className="form-row">
            <div className="form-group col-md-6">
              <Input type="text"
                     id="inputCode"
                     label="Code"
                     state={code}
                     setState={setCode}
                     constraint={{ value: rules.code }}
                     decorators={[trimDecorator, uppercaseDecorator]}
                     disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <Input type="text"
                     id="inputName"
                     label="Nickname"
                     state={name}
                     setState={setName}
                     constraint={{ value: rules.name }}
                     decorators={[trimDecorator]}
                     disabled={formDisabled} />
            </div>
          </div>
          <div className="d-flex justify-content-center mt-5">
            <div>
              <button type="submit" className="btn btn-lg btn-outline-light mr-1" disabled={formDisabled}>
                {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                Join game
              </button>
              <button onClick={backClicked} type="button" className="btn btn-lg btn-outline-danger ml-1" disabled={formDisabled}>Cancel</button>
            </div>
          </div>
        </form>
        {formError && <div className="alert alert-danger mt-5" role="alert">{formError}</div>}
      </div>
    </div>
  );
};

export default Join;
