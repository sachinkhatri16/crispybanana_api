export default function Input({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      />
      {error && <span style={{ color: '#d04545', fontSize: '11px', marginTop: '2px' }}>{error}</span>}
    </div>
  );
}

