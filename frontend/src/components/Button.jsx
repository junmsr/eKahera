import '../index.css';

function Button({ label, children, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${className}`}
    >
      {children ? children : label}
    </button>
  );
}

export default Button;