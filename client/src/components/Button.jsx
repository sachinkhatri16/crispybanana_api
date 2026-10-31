export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'primary-cta';
      case 'secondary':
        return 'secondary-btn';
      case 'outline':
        return 'sim-btn-outline';
      case 'reset':
        return 'reset-button';
      default:
        return 'primary-cta';
    }
  };

  return (
    <button
      type={type}
      className={`${getVariantClass()} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <span className="spinner-sm" /> : children}
    </button>
  );
}

