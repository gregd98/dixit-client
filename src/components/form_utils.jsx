import React from 'react';

const validate = require('validate.js');
const classNames = require('classnames');

export const trimDecorator = (value) => value.trim();
export const uppercaseDecorator = (value) => value.toUpperCase();
export const roundDecorator = (value) => {
  const f = parseFloat(value);
  return !Number.isNaN(f) ? Math.round(f * 10) / 10 : value;
};

export const Input = (prop) => {
  const {
    type, id, label, state, setState, decorators, constraint, disabled,
  } = prop;

  const handleInputChange = (event) => {
    const { value } = event.target;
    setState((rest) => ({ ...rest, value, error: '' }));
  };

  const handleBlur = () => {
    let { value } = state;
    if (decorators) {
      for (let i = 0; i < decorators.length; i += 1) {
        value = decorators[i](value);
      }
      setState((rest) => ({ ...rest, value }));
    }
    if (constraint !== undefined) {
      const validation = validate({ value }, constraint, { fullMessages: false });
      if (validation) {
        setState((rest) => ({ ...rest, error: validation.value[0] }));
      }
    }
  };

  const classes = classNames({
    'form-control': true,
    'is-invalid': state.error,
  });

  return (
    <React.Fragment>
      <label htmlFor={id} className="text-light">{label}</label>
      <input onChange={handleInputChange} onBlur={handleBlur} type={type}
             className={classes} id={id} placeholder={label}
             value={state.value} disabled={disabled} step="any" autoComplete="off"/>
      {!disabled && state.error && <div className="invalid-feedback">{state.error}</div>}
    </React.Fragment>
  );
};
