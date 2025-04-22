export default function Button({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition ${className}`}
    >
      {children}
    </button>
  );
}