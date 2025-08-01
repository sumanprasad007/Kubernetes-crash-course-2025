/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  safelist: [
    'bg-kubesimplify-blue',
    'text-kubesimplify-blue',
    'hover:bg-blue-700',
    'hover:bg-red-600',
    'hover:bg-green-600',
    'focus:ring-kubesimplify-blue',
    'bg-gray-200',
    'bg-green-500',
    'bg-red-500',
    'rounded-sm',
    'rounded-full',
    'max-w-md',
    'mx-auto',
    'p-8',
    'bg-white',
    'rounded-xl',
    'shadow-lg',
    'text-3xl',
    'font-bold',
    'text-center',
    'mb-6',
    'text-red-500',
    'font-medium',
    'mb-4',
    'block',
    'text-gray-700',
    'mb-2',
    'w-full',
    'p-3',
    'border',
    'rounded-lg',
    'focus:outline-none',
    'focus:ring-2',
    'transition',
    'duration-200',
    'text-white',
    'hover:bg-blue-700',
    'mt-5',
    'text-gray-600',
    'hover:underline',
    'min-h-screen',
    'bg-gray-50',
    'p-4',
    'shadow-lg',
    'container',
    'flex',
    'justify-between',
    'items-center',
    'space-x-6',
    'text-2xl',
    'tracking-wide',
    'hover:text-gray-200',
    'p-6',
    'mt-8',
    'mb-8',
    'text-lg',
    'font-semibold',
    'mt-3',
    'px-5',
    'py-2',
    'overflow-x-auto',
    'min-w-full',
    'text-sm',
    'uppercase',
    'tracking-wider',
    'py-4',
    'px-6',
    'text-left',
    'border-b',
    'hover:bg-gray-50',
    'text-gray-800',
    'space-x-6',
    'mt-12',
    'px-6',
    'py-2',
    'text-xl',
    'w-80',
    'h-80',
    'border-2',
    'text-4xl'
  ],
  theme: {
    extend: {
      colors: {
        'kubesimplify-blue': '#1E90FF',
      },
    },
  },
  plugins: [],
};
