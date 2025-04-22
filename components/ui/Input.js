export default function Input(props) {
  return (
    <input
      {...props}
      className={`border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${props.className || ''}`}
    />
  );
}