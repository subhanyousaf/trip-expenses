export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow ${className}`}>
      {children}
    </div>
  );
}